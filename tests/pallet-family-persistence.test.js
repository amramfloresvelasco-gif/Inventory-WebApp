'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const keys=['EntryID','SessionID','Team','LocationID','WSItemID','UOM','Quantity','ParentEntryID','PalletMultiplier','EnteredBy','EnteredAt','EntryMethod','Notes','Status'];
let activeEmail='counter@example.com',sessionAuthorized=true;
let rows=[],journal=[],writes=0,releases=0,failWrite=false,partialWrite=false,lockAvailable=true,failJournal=false,failJournalReconcile=false;
const context=vm.createContext({
 Date,Number,String,Error,Set,Map,Math,
 invUser_:()=>({email:activeEmail,role:'counter'}),
 invSession_:id=>{if(!sessionAuthorized)throw Error('Session access denied');if(id!=='SESSION1')throw Error('Unknown session');},
 invReference_:()=>({locations:[{LocationID:'L1'}],
   products:[{WSItemID:'FG1',ClassOfMaterial:'Finished Good',UnitsPerCase:12}]}),
 invRows_:name=>{assert.equal(name,'CountEntries');return rows;},
 invPalletJournalRows_:()=>journal,
 invPalletJournalPrepare_:intent=>{if(failJournal)throw Error('Simulated journal write failure');if(!journal.some(r=>r.ParentSubmissionID===intent.parentSubmissionId))journal.push({ParentSubmissionID:intent.parentSubmissionId,IntentJSON:JSON.stringify(intent),Status:'PREPARED'});},
 invPalletJournalStatus_:(intent,entries,scope)=>{
   if(failJournalReconcile)return {status:'REVIEW_REQUIRED'};
   const decision=vm.runInContext('invPalletJournalDecision_',context)(intent,journal);
   if(decision.action!=='INSPECT_CHILDREN')
     return {status:'BLOCKED',reason:decision.reason};
   const outcome=vm.runInContext('invPalletJournalReconcile_',context)(intent,entries,scope);
   return {status:outcome.action==='ACKNOWLEDGE'?'COMPLETE':outcome.action==='WRITE_CHILDREN'?'PREPARED':'REVIEW_REQUIRED'};
 },
 invSheet_:name=>{assert.equal(name,'CountEntries');return {
   getLastRow:()=>rows.length+1,
   getRange:(start,col,height,width)=>({setValues:values=>{
     assert.equal(width,14);assert.equal(height,values.length);
     writes++;if(failWrite)throw Error('Simulated write failure');
     (partialWrite?values.slice(0,2):values).forEach((v,i)=>{rows[start-2+i]=Object.fromEntries(keys.map((k,j)=>[k,v[j]]));});
   }})
 };},
 LockService:{getScriptLock:()=>({tryLock:()=>lockAvailable,releaseLock:()=>{releases++;}})}
});
for(const name of ['Code','PalletChildPlanner','PalletIntentContract','PalletFamilyRecovery','PalletIntentJournalProtocol','PalletFamilyPersistence'])
 vm.runInContext(fs.readFileSync('src/'+name+'.gs','utf8'),context);
// Code.gs supplies the production Count A/B validator; restore only the fake
// database helpers that Code.gs redeclares in the test VM.
Object.assign(context,{invUser_:()=>({email:activeEmail,role:'administrator'}),
 invSession_:id=>{if(!sessionAuthorized)throw Error('Session access denied');if(id!=='SESSION1')throw Error('Unknown session');},
 invReference_:()=>({locations:[{LocationID:'L1'}],products:[{WSItemID:'FG1',ClassOfMaterial:'Finished Good',UnitsPerCase:12}]}),
 invRows_:name=>{assert.equal(name,'CountEntries');return rows;},
 invSheet_:name=>{assert.equal(name,'CountEntries');return {getLastRow:()=>rows.length+1,getRange:(start,col,height,width)=>({setValues:values=>{assert.equal(width,14);assert.equal(height,values.length);writes++;if(failWrite)throw Error('Simulated write failure');(partialWrite?values.slice(0,2):values).forEach((v,i)=>{rows[start-2+i]=Object.fromEntries(keys.map((k,j)=>[k,v[j]]));});}})};}
});
const save=vm.runInContext('invSavePalletFamilyPrivate_',context);
const request={team:'A',parentSubmissionId:'PARENT-123456',sessionId:'SESSION1',
 locationId:'L1',productId:'FG1',pallets:5,casesPerPallet:100,
 partialCases:50,looseBottles:4,entryMethod:'Manual',notes:'test'};
const first=save(request);
assert.equal(first.childCount,7);
assert.equal(first.totalCases,550);
assert.equal(first.totalLooseBottles,4);
assert.equal(rows.length,7);
assert.equal(writes,1);
assert.equal(save(request).duplicate,true);
assert.equal(writes,1);
assert.throws(()=>save({...request,casesPerPallet:99}),/INTENT_CHANGED/);
assert.throws(()=>save({...request,notes:'changed'}),/INTENT_CHANGED/);
assert.throws(()=>save({...request,locationId:'OTHER'}));
assert.equal(writes,1);
rows=rows.slice(0,3);
assert.throws(()=>save(request),/PARTIAL/);
assert.equal(writes,1);
rows=[];journal=[];
failWrite=true;
assert.throws(()=>save(request),/Simulated write failure/);
assert.equal(rows.length,0);
failWrite=false;
lockAvailable=false;
const before=releases;
assert.throws(()=>save(request),/Inventory busy/);
assert.equal(releases,before);
lockAvailable=true;
assert.equal(save(request).childCount,7);
assert.equal(writes,3);
assert.equal(releases,8);
rows=[];journal=[];partialWrite=true;
assert.throws(()=>save({...request,parentSubmissionId:'PARENT-FAIL456'}),/could not be verified \(PARTIAL\)/);
assert.equal(rows.length,2);
partialWrite=false;
assert.throws(()=>save({...request,parentSubmissionId:'PARENT-FAIL456'}),/PARTIAL/);
assert.equal(rows.length,2);
assert.equal(releases,10);
assert.equal(journal.length,1);
// Stage 32: orphan children cannot be acknowledged without their original intent.
rows=[];journal=[];
const orphanRequest={...request,parentSubmissionId:'PARENT-ORPHAN'};
assert.equal(save(orphanRequest).childCount,7);
assert.equal(rows.length,7);
journal=[];
const writesBeforeOrphan=writes;
assert.throws(()=>save(orphanRequest),/Orphan pallet children/);
assert.equal(writes,writesBeforeOrphan);
assert.equal(journal.length,0);
// A failed journal prepare must never create physical count children.
rows=[];journal=[];failJournal=true;
const writesBeforeJournal=writes;
assert.throws(()=>save({...request,parentSubmissionId:'PARENT-JFAIL'}),/Simulated journal write failure/);
assert.equal(rows.length,0);
assert.equal(journal.length,0);
assert.equal(writes,writesBeforeJournal);
failJournal=false;
// Retry with the original intent is permitted after the journal error.
assert.equal(save({...request,parentSubmissionId:'PARENT-JFAIL'}).childCount,7);
assert.equal(journal.length,1);
// Stage 33: a journal is bound to the original creator and selected team.
rows=[];journal=[];
const scoped={...request,parentSubmissionId:'PARENT-SCOPED'};
assert.equal(save(scoped).childCount,7);
const beforeScopeWrites=writes;
activeEmail='other@example.com';
assert.throws(()=>save(scoped),/INTENT_CHANGED/);
assert.equal(writes,beforeScopeWrites);
activeEmail='counter@example.com';
assert.throws(()=>save({...scoped,team:'B'}),/INTENT_CHANGED/);
assert.equal(writes,beforeScopeWrites);

assert.throws(()=>save({...scoped,entryMethod:'Barcode'}),/INTENT_CHANGED/);
assert.equal(writes,beforeScopeWrites);
// Two journal rows for the same parent are never silently deduplicated.
journal.push({...journal[0]});
assert.throws(()=>save(scoped),/DUPLICATE_JOURNAL/);
assert.equal(writes,beforeScopeWrites);
// A collision with an unrelated parent ID cannot create a new family.
rows=[];journal=[];
const collision={...request,parentSubmissionId:'PARENT-COLLIDE'};
rows.push({EntryID:'PARENT-COLLIDE',SessionID:'SESSION1',Team:'A',LocationID:'L1',WSItemID:'FG1',Status:'ACTIVE'});
const beforeCollisionWrites=writes;
assert.throws(()=>save(collision),/Parent ID already used/);
assert.equal(writes,beforeCollisionWrites);
assert.equal(journal.length,0);
// Stage 35: server-side team and session guards must fail before any journal or child write.
rows=[];journal=[];
const guarded={...request,parentSubmissionId:'PARENT-GUARDED'};
const beforeGuardWrites=writes;
assert.throws(()=>save({...guarded,team:'C'}),/Select Count A or Count B/);
assert.equal(rows.length,0);assert.equal(journal.length,0);
assert.equal(writes,beforeGuardWrites);
sessionAuthorized=false;
assert.throws(()=>save(guarded),/Session access denied/);
assert.equal(rows.length,0);assert.equal(journal.length,0);
assert.equal(writes,beforeGuardWrites);
sessionAuthorized=true;
assert.equal(save(guarded).childCount,7);
assert.equal(journal.length,1);
// Stage 73: two independent Team A/B family saves in one location/session.
// Each team must own its own immutable parent ID and may retry only its own.
rows=[];journal=[];activeEmail='same-admin@example.com';
const teamARequest={...request,parentSubmissionId:'PARENT-TEAM-A-001',pallets:2,partialCases:3,looseBottles:1};
const teamAResult=save(teamARequest);
assert.equal(teamAResult.childCount,4);
assert.equal(teamAResult.totalCases,203);
assert.equal(rows.filter(x=>x.Team==='A').length,4);
activeEmail='same-admin@example.com';
const teamBRequest={...teamARequest,team:'B',parentSubmissionId:'PARENT-TEAM-B-001'};
const teamBResult=save(teamBRequest);
assert.equal(teamBResult.childCount,4);
assert.equal(rows.filter(x=>x.Team==='B').length,4);
assert.equal(rows.length,8);
assert.equal(journal.length,2);
const writesAfterBothTeams=writes;
assert.equal(save(teamARequest).duplicate,true);
assert.throws(()=>save({...teamARequest,team:'B'}),/INTENT_CHANGED/);
assert.equal(writes,writesAfterBothTeams);
assert.equal(save(teamBRequest).duplicate,true);
assert.equal(writes,writesAfterBothTeams);
activeEmail='same-admin@example.com';
assert.throws(()=>save({...teamBRequest,team:'A'}),/INTENT_CHANGED/);
assert.equal(save(teamARequest).duplicate,true);
assert.equal(writes,writesAfterBothTeams);
assert.equal(rows.length,8);
assert.equal(rows.filter(x=>x.Team==='A'&&x.ParentEntryID===teamARequest.parentSubmissionId).length,4);
assert.equal(rows.filter(x=>x.Team==='B'&&x.ParentEntryID===teamBRequest.parentSubmissionId).length,4);
// Stage 74: a team-specific EMPTY must block only that team's family.
// An interrupted Team B family must never affect Team A's separate family.
rows=[];journal=[];activeEmail='counter-a@example.com';
const emptyA={EntryID:'EMPTY-TEAM-A-001',SessionID:'SESSION1',LocationID:'L1',
  Team:'A',EntryMethod:'EMPTY',Status:'ACTIVE'};
rows.push(emptyA);
const aBlocked={...teamARequest,parentSubmissionId:'PARENT-EMPTY-A-001'};
const writesBeforeEmpty=writes;
assert.throws(()=>save(aBlocked),/Remove your team EMPTY entry/);
assert.equal(writes,writesBeforeEmpty);
assert.equal(journal.length,0);
activeEmail='counter-b@example.com';
const bAllowed={...teamBRequest,parentSubmissionId:'PARENT-EMPTY-B-001'};
assert.equal(save(bAllowed).childCount,4);
assert.equal(rows.filter(x=>x.ParentEntryID===bAllowed.parentSubmissionId).length,4);
assert.equal(journal.length,1);
activeEmail='counter-a@example.com';
rows=rows.filter(x=>x!==emptyA);
const aAllowed={...teamARequest,parentSubmissionId:'PARENT-A-AFTER-EMPTY'};
assert.equal(save(aAllowed).childCount,4);
assert.equal(journal.length,2);
assert.equal(rows.filter(x=>x.ParentEntryID===aAllowed.parentSubmissionId).length,4);
// Simulate missing Team B child. A's complete family must remain idempotent.
rows=rows.filter(x=>x.EntryID!==bAllowed.parentSubmissionId+'-B');
const writesBeforePartial=writes;
activeEmail='counter-b@example.com';
assert.throws(()=>save(bAllowed),/PARTIAL/);
assert.equal(writes,writesBeforePartial);
activeEmail='counter-a@example.com';
assert.equal(save(aAllowed).duplicate,true);
assert.equal(writes,writesBeforePartial);
assert.equal(journal.length,2);
// Stage 75: a previously complete family cannot be acknowledged if the
// journal's independent reconciliation is unavailable or fails closed.
rows=[];journal=[];activeEmail='counter-a@example.com';
const journalCheckRequest={...teamARequest,parentSubmissionId:'PARENT-JOURNAL-CHECK'};
assert.equal(save(journalCheckRequest).duplicate,false);
const writesBeforeReconcile=writes;
failJournalReconcile=true;
assert.throws(()=>save(journalCheckRequest),/journal retry verification failed/);
assert.equal(writes,writesBeforeReconcile);
failJournalReconcile=false;
assert.equal(save(journalCheckRequest).duplicate,true);
assert.equal(writes,writesBeforeReconcile);
// Stage 77: if the journal disappears or becomes corrupt between the
// first journal read and the retry reconciliation, never acknowledge success.
const originalJournal=journal;
journal=[];
assert.throws(()=>save(journalCheckRequest),/Orphan pallet children/);
assert.equal(writes,writesBeforeReconcile);
journal=originalJournal;
journal[0].Status='INVALID';
assert.throws(()=>save(journalCheckRequest),/UNKNOWN_JOURNAL_STATUS/);
assert.equal(writes,writesBeforeReconcile);
journal[0].Status='PREPARED';
assert.equal(save(journalCheckRequest).duplicate,true);
assert.equal(writes,writesBeforeReconcile);
console.log('Stage 77: missing and invalid retry journal fail closed');
console.log('Stage 75: completed family requires verified journal reconciliation');
console.log('Stage 74: per-team EMPTY gating and partial-family isolation passed');
console.log('Stage 73: same-account Count A/B saves and cross-count retry isolation passed');
console.log('Stage 35: explicit count selection and session authorization guards passed');
console.log('Stage 33: ownership, team, method, duplicate journal and parent collision passed');
console.log('Stage 32: orphan, journal failure and retry tests passed');
console.log('Private pallet batch writer: one write, retry, conflict, partial, lock and failure tests passed');

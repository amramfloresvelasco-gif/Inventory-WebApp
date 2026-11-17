'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const keys=['EntryID','SessionID','Team','LocationID','WSItemID','UOM','Quantity','ParentEntryID','PalletMultiplier','EnteredBy','EnteredAt','EntryMethod','Notes','Status'];
let activeEmail='counter@example.com',activeTeam='A',teamLocked=true,sessionAuthorized=true;
let rows=[],journal=[],writes=0,releases=0,failWrite=false,partialWrite=false,lockAvailable=true,failJournal=false;
const context=vm.createContext({
 Date,Number,String,Error,Set,Map,Math,
 invUser_:()=>({email:activeEmail,role:'counter',team:activeTeam,teamLocked}),
 invTeam_:u=>u.teamLocked?u.team:(()=>{throw Error('Team unlocked')})(),
 invSession_:id=>{if(!sessionAuthorized)throw Error('Session access denied');if(id!=='SESSION1')throw Error('Unknown session');},
 invReference_:()=>({locations:[{LocationID:'L1'}],
   products:[{WSItemID:'FG1',ClassOfMaterial:'Finished Good',UnitsPerCase:12}]}),
 invRows_:name=>{assert.equal(name,'CountEntries');return rows;},
 invPalletJournalRows_:()=>journal,
 invPalletJournalPrepare_:intent=>{if(failJournal)throw Error('Simulated journal write failure');if(!journal.length)journal.push({ParentSubmissionID:intent.parentSubmissionId,IntentJSON:JSON.stringify(intent),Status:'PREPARED'});},
 invPalletJournalStatus_:(intent,entries,scope)=>{
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
for(const name of ['PalletChildPlanner','PalletIntentContract','PalletFamilyRecovery','PalletIntentJournalProtocol','PalletFamilyPersistence'])
 vm.runInContext(fs.readFileSync('src/'+name+'.gs','utf8'),context);
const save=vm.runInContext('invSavePalletFamilyPrivate_',context);
const request={parentSubmissionId:'PARENT-123456',sessionId:'SESSION1',
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
activeEmail='counter@example.com';activeTeam='B';
assert.throws(()=>save(scoped),/INTENT_CHANGED/);
assert.equal(writes,beforeScopeWrites);
activeTeam='A';
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
teamLocked=false;
assert.throws(()=>save(guarded),/Team unlocked/);
assert.equal(rows.length,0);assert.equal(journal.length,0);
assert.equal(writes,beforeGuardWrites);
teamLocked=true;sessionAuthorized=false;
assert.throws(()=>save(guarded),/Session access denied/);
assert.equal(rows.length,0);assert.equal(journal.length,0);
assert.equal(writes,beforeGuardWrites);
sessionAuthorized=true;
assert.equal(save(guarded).childCount,7);
assert.equal(journal.length,1);
// Stage 73: two independent Team A/B family saves in one location/session.
// Each team must own its own immutable parent ID and may retry only its own.
rows=[];journal=[];activeTeam='A';activeEmail='counter-a@example.com';
const teamARequest={...request,parentSubmissionId:'PARENT-TEAM-A-001',pallets:2,partialCases:3,looseBottles:1};
const teamAResult=save(teamARequest);
assert.equal(teamAResult.childCount,4);
assert.equal(teamAResult.totalCases,203);
assert.equal(rows.filter(x=>x.Team==='A').length,4);
activeTeam='B';activeEmail='counter-b@example.com';
const teamBRequest={...teamARequest,parentSubmissionId:'PARENT-TEAM-B-001'};
const teamBResult=save(teamBRequest);
assert.equal(teamBResult.childCount,4);
assert.equal(rows.filter(x=>x.Team==='B').length,4);
assert.equal(rows.length,8);
assert.equal(journal.length,2);
const writesAfterBothTeams=writes;
assert.throws(()=>save(teamARequest),/INTENT_CHANGED/);
assert.equal(writes,writesAfterBothTeams);
assert.equal(save(teamBRequest).duplicate,true);
assert.equal(writes,writesAfterBothTeams);
activeTeam='A';activeEmail='counter-a@example.com';
assert.throws(()=>save(teamBRequest),/INTENT_CHANGED/);
assert.equal(save(teamARequest).duplicate,true);
assert.equal(writes,writesAfterBothTeams);
assert.equal(rows.length,8);
assert.equal(rows.filter(x=>x.Team==='A'&&x.ParentEntryID===teamARequest.parentSubmissionId).length,4);
assert.equal(rows.filter(x=>x.Team==='B'&&x.ParentEntryID===teamBRequest.parentSubmissionId).length,4);
console.log('Stage 73: independent Team A/B saves and cross-team retry isolation passed');
console.log('Stage 35: locked-team and session authorization guards passed');
console.log('Stage 33: ownership, team, method, duplicate journal and parent collision passed');
console.log('Stage 32: orphan, journal failure and retry tests passed');
console.log('Private pallet batch writer: one write, retry, conflict, partial, lock and failure tests passed');

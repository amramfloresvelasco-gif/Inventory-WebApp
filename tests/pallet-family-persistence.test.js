'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const keys=['EntryID','SessionID','Team','LocationID','WSItemID','UOM','Quantity','ParentEntryID','PalletMultiplier','EnteredBy','EnteredAt','EntryMethod','Notes','Status'];
let rows=[],journal=[],writes=0,releases=0,failWrite=false,partialWrite=false,lockAvailable=true;
const context=vm.createContext({
 Date,Number,String,Error,Set,Map,Math,
 invUser_:()=>({email:'counter@example.com',role:'counter',team:'A',teamLocked:true}),
 invTeam_:u=>u.teamLocked?u.team:(()=>{throw Error('Team unlocked')})(),
 invSession_:id=>{if(id!=='SESSION1')throw Error('Unknown session');},
 invReference_:()=>({locations:[{LocationID:'L1'}],
   products:[{WSItemID:'FG1',ClassOfMaterial:'Finished Good',UnitsPerCase:12}]}),
 invRows_:name=>{assert.equal(name,'CountEntries');return rows;},
 invPalletJournalRows_:()=>journal,
 invPalletJournalPrepare_:intent=>{if(!journal.length)journal.push({ParentSubmissionID:intent.parentSubmissionId,IntentJSON:JSON.stringify(intent),Status:'PREPARED'});},
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
assert.throws(()=>save({...request,casesPerPallet:99}),/BLOCKED/);
assert.throws(()=>save({...request,notes:'changed'}),/BLOCKED/);
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
console.log('Private pallet batch writer: one write, retry, conflict, partial, lock and failure tests passed');

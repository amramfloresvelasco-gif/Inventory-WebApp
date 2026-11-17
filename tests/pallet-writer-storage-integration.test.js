'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const keys=['EntryID','SessionID','Team','LocationID','WSItemID','UOM','Quantity','ParentEntryID','PalletMultiplier','EnteredBy','EnteredAt','EntryMethod','Notes','Status'];
const headers=['ParentSubmissionID','SessionID','IntentJSON','Status','CreatedAt','CreatedBy'];
const marker='TEST_ONLY_JOURNAL_20261116_STAGE41';
let counts=[],journal=[[marker,'TEST_ONLY_NO_SESSION',JSON.stringify({testOnly:true,marker}),'TEST_ONLY','2026-11-17','SYSTEM_TEST_NO_USER']];
let countWrites=0,journalWrites=0,partial=false,lockReleases=0;
const countSheet={getLastRow:()=>counts.length+1,getRange:(r,c,h,w)=>({setValues:values=>{
 assert.equal(w,14);countWrites++;
 (partial?values.slice(0,1):values).forEach((v,i)=>{counts[r-2+i]=Object.fromEntries(keys.map((k,j)=>[k,v[j]]));});
}})};
const journalSheet={getLastRow:()=>journal.length+1,getRange:(r,c,h,w)=>({
 getDisplayValues:()=>[headers.slice()],
 getValues:()=>journal.slice(r-2,r-2+h).map(v=>v.slice()),
 setValues:values=>{assert.equal(w,6);journalWrites++;values.forEach(v=>journal.push(v.slice()));}
})};
const ctx=vm.createContext({Date,Number,String,Error,Set,Map,Math,JSON,
 invUser_:()=>({email:'counter@example.com',role:'counter',team:'A',teamLocked:true}),
 invTeam_:u=>u.team,
 invSession_:id=>{assert.equal(id,'SESSION1');},
 invReference_:()=>({locations:[{LocationID:'L1'}],
 products:[{WSItemID:'FG1',ClassOfMaterial:'Finished Good',UnitsPerCase:12}]}),
 invRows_:name=>{assert.equal(name,'CountEntries');return counts;},
 invSheet_:name=>name==='CountEntries'?countSheet:name==='PalletSubmissionJournal'?journalSheet:(()=>{throw Error('Unexpected sheet');})(),
 LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{lockReleases++;}})}
});
for(const name of ['PalletChildPlanner','PalletIntentContract','PalletFamilyRecovery',
 'PalletIntentJournalProtocol','PalletIntentJournalStorage','PalletFamilyPersistence'])
 vm.runInContext(fs.readFileSync('src/'+name+'.gs','utf8'),ctx);
const save=vm.runInContext('invSavePalletFamilyPrivate_',ctx);
const request={parentSubmissionId:'STAGE49-PARENT-01',sessionId:'SESSION1',locationId:'L1',
 productId:'FG1',pallets:2,casesPerPallet:24,partialCases:4,looseBottles:2,
 entryMethod:'QR',notes:'isolated test'};
const result=save(request);
assert.equal(result.ok,true);assert.equal(result.duplicate,false);
assert.equal(countWrites,1);assert.equal(journalWrites,1);
assert.equal(journal.length,2);assert.equal(journal[0][0],marker);
assert.equal(journal[1][0],request.parentSubmissionId);assert.equal(journal[1][3],'PREPARED');
assert.equal(counts.length,result.childCount);
assert.equal(save(request).duplicate,true);
assert.equal(countWrites,1);assert.equal(journalWrites,1);
assert.throws(()=>save({...request,notes:'changed'}),/INTENT_CHANGED/);
assert.equal(journalWrites,1);
counts=[];journal=[journal[0]];partial=true;
const interrupted={...request,parentSubmissionId:'STAGE49-PARTIAL-01'};
assert.throws(()=>save(interrupted),/could not be verified \(PARTIAL\)/);
assert.equal(counts.length,1);assert.equal(journalWrites,2);
partial=false;
assert.throws(()=>save(interrupted),/PARTIAL/);
assert.equal(countWrites,2);assert.equal(journalWrites,2);
assert.equal(lockReleases,5);
console.log('Stage 49: actual private writer and actual journal storage adapter pass complete, retry, mutation and partial-write scenarios');

'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const keys=['EntryID','SessionID','Team','LocationID','WSItemID','UOM','Quantity','ParentEntryID','PalletMultiplier','EnteredBy','EnteredAt','EntryMethod','Notes','Status'];
const headers=['ParentSubmissionID','SessionID','IntentJSON','Status','CreatedAt','CreatedBy'];
let counts=[],journal=[],failChildren=true,childAttempts=0,journalWrites=0,releases=0;
const countSheet={getLastRow:()=>counts.length+1,getRange:(r,c,h,w)=>({setValues:values=>{
 childAttempts++;if(failChildren)throw Error('Simulated child write outage');
 for(const [i,v] of values.entries())counts[r-2+i]=Object.fromEntries(keys.map((k,j)=>[k,v[j]]));
}})};
const journalSheet={getLastRow:()=>journal.length+1,getRange:(r,c,h,w)=>({
 getDisplayValues:()=>[headers],
 getValues:()=>journal.slice(r-2,r-2+h).map(v=>v.slice()),
 setValues:values=>{journalWrites++;for(const v of values)journal.push(v.slice());}
})};
const ctx=vm.createContext({Date,Number,String,Error,Set,Map,Math,JSON,
 invUser_:()=>({email:'counter@example.com',role:'counter'}),
 invCountSelection_:request=>{const team=String(request&&request.team||'').trim().toUpperCase();if(!['A','B'].includes(team))throw Error('Select Count A or Count B.');return team;},
 invSession_:id=>{assert.equal(id,'SESSION1');},
 invReference_:()=>({locations:[{LocationID:'L1'}],products:[{WSItemID:'FG1',ClassOfMaterial:'Finished Good',UnitsPerCase:12}]}),
 invRows_:name=>{assert.equal(name,'CountEntries');return counts;},
 invSheet_:name=>name==='CountEntries'?countSheet:name==='PalletSubmissionJournal'?journalSheet:(()=>{throw Error('Unexpected sheet');})(),
 LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{releases++;}})}
});
for(const name of ['PalletChildPlanner','PalletIntentContract','PalletFamilyRecovery','PalletIntentJournalProtocol','PalletIntentJournalStorage','PalletFamilyPersistence'])
 vm.runInContext(fs.readFileSync('src/'+name+'.gs','utf8'),ctx);
const save=vm.runInContext('invSavePalletFamilyPrivate_',ctx);
const request={team:'A',parentSubmissionId:'STAGE50-RETRY-01',sessionId:'SESSION1',locationId:'L1',
 productId:'FG1',pallets:2,casesPerPallet:24,partialCases:3,looseBottles:2,
 entryMethod:'QR',notes:'simulation'};
assert.throws(()=>save(request),/Simulated child write outage/);
assert.equal(journalWrites,1);assert.equal(journal.length,1);
assert.equal(journal[0][3],'PREPARED');assert.equal(counts.length,0);
failChildren=false;
const recovered=save(request);
assert.equal(recovered.ok,true);assert.equal(recovered.duplicate,false);
assert.equal(journalWrites,1,'retry must reuse immutable journal');
assert.equal(childAttempts,2);assert.equal(counts.length,recovered.childCount);
assert.equal(save(request).duplicate,true);
assert.equal(childAttempts,2);assert.equal(journalWrites,1);
assert.throws(()=>save({...request,notes:'different'}),/INTENT_CHANGED/);
assert.equal(releases,4);
console.log('Stage 50: durable PREPARED intent survives child write failure; retry writes once and duplicate retry is idempotent');

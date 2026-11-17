'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const headers=['ParentSubmissionID','SessionID','IntentJSON','Status','CreatedAt','CreatedBy'];
const marker='TEST_ONLY_JOURNAL_20261116_STAGE41';
const audit=[marker,'TEST_ONLY_NO_SESSION',JSON.stringify({testOnly:true,marker,
 purpose:'Journal storage read/write verification only; no pallet submission; no count children'}),
 'TEST_ONLY','2026-11-17T02:02:15.017Z','SYSTEM_TEST_NO_USER'];
let rows=[audit.slice()],writes=0;
const sheet={getLastRow:()=>rows.length+1,
 getRange:(r,c,h,w)=>({
 getDisplayValues:()=>r===1?[headers.slice(c-1,c-1+w)]:[],
 getValues:()=>rows.slice(r-2,r-2+h).map(row=>row.slice(c-1,c-1+w)),
 setValues:values=>{assert.equal(r,rows.length+2);assert.equal(c,1);assert.equal(w,6);
 writes++;for(const value of values)rows.push(value.slice());}
 })};
const ctx=vm.createContext({JSON,Number,String,Error,Math,Set,Date,
 invSheet_:name=>{assert.equal(name,'PalletSubmissionJournal');return sheet;}});
for(const name of ['PalletChildPlanner','PalletIntentContract','PalletFamilyRecovery',
 'PalletIntentJournalProtocol','PalletIntentJournalStorage'])
 vm.runInContext(fs.readFileSync('src/'+name+'.gs','utf8'),ctx);
const make=vm.runInContext('invPalletIntent_',ctx);
const read=vm.runInContext('invPalletJournalRows_',ctx);
const prepare=vm.runInContext('invPalletJournalPrepare_',ctx);
const intent=make({parentSubmissionId:'PARENT-STAGE48',sessionId:'S1',locationId:'L1',
 productId:'FG1',pallets:1,casesPerPallet:12,partialCases:0,looseBottles:0},
 {email:'counter@example.com',team:'A'});
assert.equal(read().length,1);
assert.equal(read()[0].ParentSubmissionID,marker);
assert.equal(prepare(intent).prepared,true);
assert.equal(writes,1);
assert.equal(rows.length,2);
assert.equal(rows[0][0],marker,'audit row must be immutable');
assert.equal(rows[0][3],'TEST_ONLY');
assert.equal(rows[1][0],intent.parentSubmissionId);
assert.equal(rows[1][3],'PREPARED');
assert.equal(prepare(intent).retry,true);
assert.equal(writes,1,'retry must not append');
assert.throws(()=>prepare({...intent,notes:'changed'}),/INTENT_CHANGED/);
assert.equal(writes,1);
rows.push(rows[1].slice());
assert.throws(()=>prepare(intent),/DUPLICATE_JOURNAL/);
assert.equal(writes,1);
console.log('Stage 48: real storage adapter preserves Stage 41 audit row while preparing, retrying and blocking unsafe intents');

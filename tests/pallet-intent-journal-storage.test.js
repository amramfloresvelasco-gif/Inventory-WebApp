'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const headers=['ParentSubmissionID','SessionID','IntentJSON','Status','CreatedAt','CreatedBy'];
let rows=[],writes=0,corrupt=false,partial=false,throwWrite=false;
const sheet={
 getLastRow:()=>rows.length+1,
 getRange:(start,col,count,width)=>({
  getDisplayValues:()=>[corrupt?['WRONG',...headers.slice(1)]:headers],
  getValues:()=>rows.map(r=>r.slice()),
  setValues:values=>{writes++;if(throwWrite)throw Error('Simulated Sheets append failure');if(!partial)rows.push(values[0].slice());}
 })
};
const ctx=vm.createContext({JSON,Number,String,Error,Math,Set,Date,
 invSheet_:name=>{assert.equal(name,'PalletSubmissionJournal');return sheet;}
});
for(const name of ['PalletChildPlanner','PalletIntentContract','PalletFamilyRecovery',
 'PalletIntentJournalProtocol','PalletIntentJournalStorage'])
 vm.runInContext(fs.readFileSync('src/'+name+'.gs','utf8'),ctx);
const make=vm.runInContext('invPalletIntent_',ctx);
const prepare=vm.runInContext('invPalletJournalPrepare_',ctx);
const read=vm.runInContext('invPalletJournalRows_',ctx);
const status=vm.runInContext('invPalletJournalStatus_',ctx);
const intent=make({parentSubmissionId:'PARENT-123456',sessionId:'S1',locationId:'L1',
 productId:'FG1',pallets:2,casesPerPallet:100,partialCases:0,looseBottles:4},
 {email:'a@example.com',team:'A'});
assert.equal(prepare(intent).prepared,true);
assert.equal(rows.length,1);
assert.equal(rows[0][3],'PREPARED');
assert.equal(prepare(intent).retry,true);
assert.equal(writes,1);
assert.throws(()=>prepare({...intent,notes:'changed'}),/INTENT_CHANGED/);
const scope={sessionId:'S1',locationId:'L1',productId:'FG1',team:'A',
 email:'a@example.com',entryMethod:'Manual',notes:''};
assert.equal(status(intent,[],scope).status,'PREPARED');
const children=intent.children.map(c=>({
 EntryID:c.entryId,ParentEntryID:intent.parentSubmissionId,
 UOM:c.uom,Quantity:c.quantity,PalletMultiplier:1,Status:'ACTIVE',
 SessionID:'S1',LocationID:'L1',WSItemID:'FG1',Team:'A',
 EnteredBy:'a@example.com',EntryMethod:'Manual',Notes:''
}));
assert.equal(status(intent,children,scope).status,'COMPLETE');
assert.equal(status(intent,children.slice(0,1),scope).status,'REVIEW_REQUIRED');
assert.equal(rows.length,1);
rows=[];partial=true;
assert.throws(()=>prepare(intent),/prepare not verified/);
assert.equal(rows.length,0);
partial=false;corrupt=true;
assert.throws(()=>read(),/Unexpected PalletSubmissionJournal schema/);
// Stage 34: test storage failures, duplicate records and corrupt durable intents.
corrupt=false;rows=[];throwWrite=true;
const beforeFailure=writes;
assert.throws(()=>prepare(intent),/Simulated Sheets append failure/);
assert.equal(writes,beforeFailure+1);
assert.equal(rows.length,0);
throwWrite=false;
assert.equal(prepare(intent).prepared,true);
assert.equal(rows.length,1);
rows.push(rows[0].slice());
const beforeDuplicate=writes;
assert.throws(()=>prepare(intent),/DUPLICATE_JOURNAL/);
assert.equal(status(intent,children,scope).status,'BLOCKED');
assert.equal(writes,beforeDuplicate);
rows.pop();
rows[0][2]='{invalid-json';
assert.throws(()=>prepare(intent),/INVALID_STORED_INTENT/);
assert.equal(status(intent,children,scope).status,'BLOCKED');
rows[0][2]=JSON.stringify(intent);
rows[0][3]='UNKNOWN';
assert.throws(()=>prepare(intent),/UNKNOWN_JOURNAL_STATUS/);
assert.equal(status(intent,children,scope).status,'BLOCKED');
rows[0][3]='PREPARED';
assert.equal(status(intent,children,scope).status,'COMPLETE');
console.log('Stage 34: storage failure, duplicate rows, corrupt intent and status passed');
console.log('Pallet journal adapter: append-only, retries, schema, verification, reconciliation passed');

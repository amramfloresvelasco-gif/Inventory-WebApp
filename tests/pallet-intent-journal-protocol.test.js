'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({JSON,Number,String,Error,Math,Set});
for(const name of ['PalletChildPlanner','PalletIntentContract','PalletFamilyRecovery','PalletIntentJournalProtocol'])
 vm.runInContext(fs.readFileSync('src/'+name+'.gs','utf8'),ctx);
const make=vm.runInContext('invPalletIntent_',ctx);
const decide=vm.runInContext('invPalletJournalDecision_',ctx);
const reconcile=vm.runInContext('invPalletJournalReconcile_',ctx);
const req={parentSubmissionId:'PARENT-123456',sessionId:'S1',locationId:'L1',
 productId:'FG1',pallets:2,casesPerPallet:100,partialCases:50,looseBottles:4};
const intent=make(req,{email:'a@example.com',team:'A'});
const row={ParentSubmissionID:intent.parentSubmissionId,IntentJSON:JSON.stringify(intent),Status:'PREPARED'};
assert.equal(decide(intent,[]).action,'WRITE_INTENT');
assert.equal(decide(intent,[row]).action,'INSPECT_CHILDREN');
assert.equal(decide(intent,[{...row,Status:'COMMITTED'}]).action,'INSPECT_CHILDREN');
assert.equal(decide(intent,[row,row]).reason,'DUPLICATE_JOURNAL');
assert.equal(decide(intent,[{...row,IntentJSON:'{'}]).reason,'INVALID_STORED_INTENT');
assert.equal(decide(intent,[{...row,Status:'BAD'}]).reason,'UNKNOWN_JOURNAL_STATUS');
assert.equal(decide(make({...req,looseBottles:5},{email:'a@example.com',team:'A'}),[row]).reason,'INTENT_CHANGED');
assert.equal(decide(make(req,{email:'b@example.com',team:'A'}),[row]).reason,'INTENT_CHANGED');
const scope={sessionId:'S1',locationId:'L1',productId:'FG1',team:'A',email:'a@example.com',entryMethod:'Manual',notes:''};
const children=intent.children.map(c=>({
 EntryID:c.entryId,ParentEntryID:intent.parentSubmissionId,Quantity:c.quantity,
 UOM:c.uom,PalletMultiplier:1,Status:'ACTIVE',SessionID:'S1',LocationID:'L1',
 WSItemID:'FG1',Team:'A',EnteredBy:'a@example.com',EntryMethod:'Manual',Notes:''
}));
assert.equal(reconcile(intent,[],scope).action,'WRITE_CHILDREN');
assert.equal(reconcile(intent,children,scope).action,'ACKNOWLEDGE');
assert.equal(reconcile(intent,children.slice(0,2),scope).action,'BLOCK');
assert.equal(reconcile(intent,[...children,children[0]],scope).action,'BLOCK');
console.log('Write-ahead journal decision and recovery protocol tests passed');

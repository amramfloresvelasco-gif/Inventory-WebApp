'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({Number,String,Set,Array,JSON,Error});
for(const file of ['PalletChildPlanner','PalletIntentContract','PalletFamilyRecovery','PalletIntentJournalProtocol'])
 vm.runInContext(fs.readFileSync('src/'+file+'.gs','utf8'),ctx);
const make=vm.runInContext('invPalletIntent_',ctx);
const decide=vm.runInContext('invPalletJournalDecision_',ctx);
const reconcile=vm.runInContext('invPalletJournalReconcile_',ctx);
const request={parentSubmissionId:'RECOVERY-SIM-01',sessionId:'SESSION1',locationId:'L1',
 productId:'FG1',pallets:2,casesPerPallet:20,partialCases:5,looseBottles:3,
 entryMethod:'QR',notes:'simulation only'};
const intent=make(request,{email:'counter@example.com',team:'A'});
const audit={ParentSubmissionID:'TEST_ONLY_JOURNAL_20261116_STAGE41',Status:'TEST_ONLY',IntentJSON:'{}'};
const prepared={ParentSubmissionID:intent.parentSubmissionId,Status:'PREPARED',IntentJSON:JSON.stringify(intent)};
const scope={sessionId:intent.sessionId,locationId:intent.locationId,productId:intent.productId,
 team:intent.team,email:intent.email,entryMethod:intent.entryMethod,notes:intent.notes};
const physical=intent.children.map(c=>({EntryID:c.entryId,ParentEntryID:intent.parentSubmissionId,
 UOM:c.uom,Quantity:c.quantity,Status:'ACTIVE',PalletMultiplier:1,
 SessionID:intent.sessionId,LocationID:intent.locationId,WSItemID:intent.productId,
 Team:intent.team,EnteredBy:intent.email,EntryMethod:intent.entryMethod,Notes:intent.notes}));
assert.equal(decide(intent,[audit]).action,'WRITE_INTENT');
assert.equal(decide(intent,[audit,prepared]).reason,'PREPARED_RETRY');
assert.equal(reconcile(intent,[],scope).action,'WRITE_CHILDREN');
assert.equal(reconcile(intent,physical,scope).action,'ACKNOWLEDGE');
assert.equal(reconcile(intent,physical.slice(0,1),scope).state,'PARTIAL');
assert.equal(reconcile(intent,physical.slice(0,1),scope).action,'BLOCK');
assert.equal(reconcile(intent,[...physical,physical[0]],scope).state,'BLOCKED');
assert.equal(reconcile(intent,[...physical,{...physical[0],EntryID:'UNEXPECTED'}],scope).state,'BLOCKED');
assert.equal(reconcile(intent,physical.map((r,i)=>i===0?{...r,Quantity:r.Quantity+1}:r),scope).state,'BLOCKED');
assert.equal(reconcile(intent,physical.map((r,i)=>i===0?{...r,EnteredBy:'intruder@example.com'}:r),scope).state,'BLOCKED');
assert.equal(decide({...intent,notes:'changed'},[prepared]).reason,'INTENT_CHANGED');
assert.equal(decide(intent,[prepared,prepared]).reason,'DUPLICATE_JOURNAL');
assert.equal(decide(intent,[{...prepared,IntentJSON:'bad json'}]).reason,'INVALID_STORED_INTENT');
console.log('Stage 47: canonical recovery simulations cover empty, complete, partial, duplicate, mismatch and immutable intent');

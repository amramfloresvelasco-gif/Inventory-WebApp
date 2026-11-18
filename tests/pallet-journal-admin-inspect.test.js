'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let admin=true,locked=true,releases=0,rows=[],journal=[];
const ctx=vm.createContext({
  console,Date,Number,String,JSON,Set,Error,RegExp,
  invRequireAdmin_:()=>{if(!admin)throw Error('Administrator permission required.');},
  invPalletJournalRows_:()=>journal,
  invRows_:name=>{assert.equal(name,'CountEntries');return rows;},
  LockService:{getScriptLock:()=>({tryLock:()=>locked,releaseLock:()=>{releases++;}})}
});
for(const file of ['PalletChildPlanner','PalletIntentContract','PalletFamilyRecovery','PalletFamilyDiagnostics'])
  vm.runInContext(fs.readFileSync('src/'+file+'.gs','utf8'),ctx);
const inspect=vm.runInContext('apiInventoryAdminPalletJournalInspect',ctx);
const intent=vm.runInContext('invPalletIntent_',ctx)({
  parentSubmissionId:'PARENT-123456',sessionId:'SESSION1',locationId:'L1',
  productId:'FG1',pallets:2,casesPerPallet:10,partialCases:0,looseBottles:3
},{email:'a@example.com',team:'A'});
const request={parentSubmissionId:intent.parentSubmissionId};
assert.equal(inspect(request).reason,'JOURNAL_NOT_FOUND');
journal=[{ParentSubmissionID:request.parentSubmissionId,SessionID:'SESSION1',
  CreatedBy:intent.email,Status:'PREPARED',IntentJSON:JSON.stringify(intent)}];
assert.equal(inspect(request).status,'EMPTY');
const childRow=child=>({
  EntryID:child.entryId,ParentEntryID:intent.parentSubmissionId,SessionID:'SESSION1',
  LocationID:'L1',WSItemID:'FG1',Team:'A',EnteredBy:'a@example.com',
  EntryMethod:'Manual',Notes:'',UOM:child.uom,Quantity:child.quantity,
  PalletMultiplier:1,Status:'ACTIVE'
});
rows=[childRow(intent.children[0])];
let result=inspect(request);
assert.equal(result.status,'PARTIAL');
assert.equal(result.matchedChildren,1);
assert.equal(result.missingChildren,2);
assert.deepEqual(Array.from(result.missingKinds),['full-pallet','loose-bottles']);
rows=intent.children.map(childRow);
assert.equal(inspect(request).status,'COMPLETE');
rows[0].Quantity=99;
assert.equal(inspect(request).status,'BLOCKED');
rows=intent.children.map(childRow);
journal.push({...journal[0]});
assert.equal(inspect(request).reason,'DUPLICATE_JOURNAL');
journal.pop();
journal[0].IntentJSON='{';
assert.equal(inspect(request).reason,'INVALID_INTENT_JSON');
journal[0].IntentJSON=JSON.stringify({...intent,totalCases:999});
assert.equal(inspect(request).reason,'NONCANONICAL_INTENT');
journal[0].IntentJSON=JSON.stringify(intent);
admin=false;
assert.throws(()=>inspect(request),/Administrator/);
admin=true;locked=false;
const before=releases;
assert.throws(()=>inspect(request),/Inventory busy/);
assert.equal(releases,before);
assert.equal(releases>0,true);
console.log('Journal-aware admin pallet inspection: read-only recovery classifications and authorization passed');

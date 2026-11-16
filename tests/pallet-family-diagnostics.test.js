'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const rows=[];
let admin=true,releases=0,available=true;
const context=vm.createContext({
 Date,Number,String,Error,Set,RegExp,
 invRequireAdmin_:()=>{if(!admin)throw Error('Administrator permission required.');},
 invSession_:id=>{if(id!=='SESSION1')throw Error('Unknown session');},
 invRows_:name=>{assert.equal(name,'CountEntries');return rows;},
 LockService:{getScriptLock:()=>({tryLock:()=>available,releaseLock:()=>{releases++;}})}
});
vm.runInContext(fs.readFileSync('src/PalletFamilyDiagnostics.gs','utf8'),context);
const inspect=vm.runInContext('apiInventoryAdminPalletFamilyInspect',context);
const req={parentSubmissionId:'PARENT-123456',sessionId:'SESSION1'};
assert.equal(inspect(req).status,'NOT_FOUND');
const base={ParentEntryID:req.parentSubmissionId,SessionID:'SESSION1',
 Team:'A',LocationID:'L1',WSItemID:'FG1',EnteredBy:'a@example.com',
 PalletMultiplier:1,Status:'ACTIVE'};
rows.push({...base,EntryID:'PARENT-123456-A',UOM:'Case',Quantity:100});
rows.push({...base,EntryID:'PARENT-123456-B',UOM:'Bottle',Quantity:4});
let result=inspect(req);
assert.equal(result.status,'STRUCTURALLY_VALID');
assert.equal(result.intentVerified,false);
assert.equal(result.totalCases,100);
assert.equal(result.totalLooseBottles,4);
rows.push({...base,EntryID:'PARENT-123456-B',UOM:'Bottle',Quantity:4});
result=inspect(req);
assert.equal(result.status,'REVIEW_REQUIRED');
assert.equal(Array.from(result.issues).includes('DUPLICATE_ENTRY_ID'),true);
rows.pop();
rows[1].Team='B';
assert.equal(Array.from(inspect(req).issues).includes('TEAM_MISMATCH'),true);
rows[1].Team='A';
rows[1].Status='DELETED';
assert.equal(Array.from(inspect(req).issues).includes('INACTIVE_CHILD'),true);
rows[1].Status='ACTIVE';
admin=false;
assert.throws(()=>inspect(req),/Administrator/);
admin=true;available=false;
const before=releases;
assert.throws(()=>inspect(req),/Inventory busy/);
assert.equal(releases,before);
console.log('Admin pallet diagnostics read-only and access-control tests passed');

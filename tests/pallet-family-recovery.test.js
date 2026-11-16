'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context=vm.createContext({});
for(const name of ['PalletChildPlanner','PalletFamilyRecovery'])
 vm.runInContext(fs.readFileSync('src/'+name+'.gs','utf8'),context);
const plan=vm.runInContext('invPlanPalletChildren_',context);
const classify=vm.runInContext('invClassifyPalletFamily_',context);
const family=plan({parentSubmissionId:'PARENT-123456',pallets:2,casesPerPallet:100,partialCases:50,looseBottles:4});
const rows=family.children.map(c=>({EntryID:c.entryId,ParentEntryID:c.parentSubmissionId,
 UOM:c.uom,Quantity:c.quantity,Status:'ACTIVE',PalletMultiplier:1}));
assert.equal(classify(family,[]).state,'EMPTY');
assert.equal(classify(family,rows).state,'COMPLETE');
assert.equal(classify(family,rows).canAppend,false);
assert.equal(classify(family,rows.slice(0,2)).state,'PARTIAL');
assert.equal(classify(family,rows.slice(0,2)).canAppend,false);
assert.equal(classify(family,[...rows,rows[0]]).state,'BLOCKED');
assert.equal(classify(family,[...rows,{...rows[0],EntryID:'PARENT-123456-Z'}]).state,'BLOCKED');
assert.equal(classify(family,rows.map((r,i)=>i===0?{...r,Quantity:101}:r)).state,'BLOCKED');
assert.equal(classify(family,rows.map((r,i)=>i===0?{...r,Status:'REMOVED'}:r)).state,'BLOCKED');
assert.equal(classify(family,rows.map((r,i)=>i===0?{...r,ParentEntryID:'OTHER'}:r)).state,'BLOCKED');
assert.equal(classify(family,[{...rows[0],EntryID:'PARENT-123456-Z'}]).state,'BLOCKED');
console.log('Pallet family recovery classification tests passed');

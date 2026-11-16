'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync('src/PalletChildPlanner.gs','utf8'),ctx);
const plan=vm.runInContext('invPlanPalletChildren_',ctx);
const id='submission_123456';
const result=plan({parentSubmissionId:id,pallets:5,casesPerPallet:100,partialCases:50,looseBottles:4});
assert.equal(result.childCount,7);
assert.equal(result.totalCases,550);
assert.equal(result.totalLooseBottles,4);
assert.deepEqual(Array.from(result.children,x=>x.quantity),[100,100,100,100,100,50,4]);
assert.deepEqual(Array.from(result.children,x=>x.uom),['Case','Case','Case','Case','Case','Case','Bottle']);
assert.equal(result.children[0].entryId,id+'-A');
assert.equal(result.children[6].entryId,id+'-G');
assert.equal(result.children.every(x=>x.parentSubmissionId===id),true);
assert.equal(plan({parentSubmissionId:id,casesPerPallet:12}).childCount,1);
assert.equal(plan({parentSubmissionId:id,pallets:0,casesPerPallet:0,looseBottles:3}).childCount,1);
const thirty=plan({parentSubmissionId:id,pallets:30,casesPerPallet:1});
assert.equal(thirty.children[25].entryId,id+'-Z');
assert.equal(thirty.children[26].entryId,id+'-AA');
assert.equal(thirty.children[29].entryId,id+'-AD');
assert.deepEqual(Array.from(plan({parentSubmissionId:id,pallets:2,casesPerPallet:10}).children,x=>x.entryId),
 Array.from(plan({parentSubmissionId:id,pallets:2,casesPerPallet:10}).children,x=>x.entryId));
for(const bad of [
 {pallets:2,casesPerPallet:0},{pallets:1.5,casesPerPallet:10},
 {pallets:101,casesPerPallet:10},{pallets:0,casesPerPallet:10},
 {pallets:0,casesPerPallet:0},{pallets:1,casesPerPallet:10,looseBottles:-1}
])assert.throws(()=>plan({parentSubmissionId:id,...bad}));
console.log('Pallet planner fixture and safety tests passed');

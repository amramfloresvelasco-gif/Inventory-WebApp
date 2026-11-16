'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({JSON,Number,String,Error,Math});
for(const name of ['PalletChildPlanner','PalletIntentContract'])
 vm.runInContext(fs.readFileSync('src/'+name+'.gs','utf8'),ctx);
const make=vm.runInContext('invPalletIntent_',ctx);
const equal=vm.runInContext('invPalletIntentEqual_',ctx);
const request={parentSubmissionId:'PARENT-123456',sessionId:'S1',locationId:'L1',
 productId:'FG1',pallets:5,casesPerPallet:100,partialCases:50,looseBottles:4};
const identity={email:'A@Example.com',team:'A'};
const intent=make(request,identity);
assert.equal(intent.childCount,7);
assert.equal(intent.totalCases,550);
assert.equal(intent.totalLooseBottles,4);
assert.equal(intent.children[0].entryId,'PARENT-123456-A');
assert.equal(intent.children[6].entryId,'PARENT-123456-G');
assert.equal(intent.email,'a@example.com');
assert.equal(equal(intent,make({...request},identity)),true);
for(const altered of [
 {...request,casesPerPallet:99},{...request,partialCases:49},
 {...request,looseBottles:3},{...request,locationId:'L2'},
 {...request,productId:'FG2'},{...request,notes:'different'},
 {...request,entryMethod:'QR'}
])assert.equal(equal(intent,make(altered,identity)),false);
assert.equal(equal(intent,make(request,{...identity,email:'other@example.com'})),false);
assert.equal(equal(intent,make(request,{...identity,team:'B'})),false);
assert.throws(()=>make({...request,pallets:1.5},identity));
assert.throws(()=>make({...request,notes:123},identity));
assert.throws(()=>make({...request,entryMethod:'EMPTY'},identity));
assert.throws(()=>make(request,{...identity,team:'C'}));
assert.equal(equal(intent,null),false);
console.log('Canonical pallet intent contract tests passed');

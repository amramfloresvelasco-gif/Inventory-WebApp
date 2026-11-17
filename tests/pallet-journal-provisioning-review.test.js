'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({Array,Number,String});
vm.runInContext(fs.readFileSync('src/PalletJournalProvisioningReview.gs','utf8'),ctx);
const decide=vm.runInContext('invPalletJournalProvisioningDecision_',ctx);
const headers=['ParentSubmissionID','SessionID','IntentJSON','Status','CreatedAt','CreatedBy'];
assert.equal(decide(false,null,0).state,'MISSING');
assert.equal(decide(false,null,0).safeToCreateWithApproval,true);
assert.equal(decide(true,headers,0).state,'EMPTY_READY_FOR_ADMIN_REVIEW');
assert.equal(decide(true,headers,0).canEnable,false);
assert.equal(decide(true,headers,2).state,'EXISTING_RECORDS_REVIEW');
assert.equal(decide(true,headers.slice(0,5),0).state,'SCHEMA_MISMATCH');
assert.equal(decide(true,['WRONG',...headers.slice(1)],0).state,'SCHEMA_MISMATCH');
assert.equal(decide(true,headers,-1).state,'UNKNOWN_CONTENTS');
for(const state of [decide(true,headers,0),decide(true,headers,1),decide(true,headers,-1)])
 assert.equal(state.canEnable,false);
console.log('Stage 37: journal provisioning review fails closed');

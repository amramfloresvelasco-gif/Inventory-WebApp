'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const headers=['ParentSubmissionID','SessionID','IntentJSON','Status','CreatedAt','CreatedBy'];
let admin=false,exists=false,rows=0,columns=6,currentHeaders=headers.slice(),reads=0;
const sheet={getLastRow:()=>{reads++;return rows;},getLastColumn:()=>{reads++;return columns;},
 getRange:()=>({getDisplayValues:()=>{reads++;return [currentHeaders.slice()];}})};
const ctx=vm.createContext({Array,Number,String,Error,
 INV_DB_ID:'TEST',invRequireAdmin_:()=>{if(!admin)throw Error('Administrator permission required');},
 SpreadsheetApp:{openById:id=>{assert.equal(id,'TEST');reads++;return {getSheetByName:name=>{
 assert.equal(name,'PalletSubmissionJournal');reads++;return exists?sheet:null;}}}}
});
for(const name of ['PalletJournalProvisioningReview','PalletJournalAdminPreflight'])
 vm.runInContext(fs.readFileSync('src/'+name+'.gs','utf8'),ctx);
const run=vm.runInContext('apiInventoryPalletJournalPreflight',ctx);
assert.throws(()=>run(),/Administrator permission required/);
assert.equal(reads,0);
admin=true;
assert.equal(run().state,'MISSING');
exists=true;rows=1;
assert.equal(run().state,'EMPTY_READY_FOR_ADMIN_REVIEW');
rows=3;
assert.equal(run().state,'EXISTING_RECORDS_REVIEW');
rows=1;columns=7;
assert.equal(run().state,'SCHEMA_MISMATCH');
columns=6;currentHeaders=['WRONG',...headers.slice(1)];
assert.equal(run().state,'SCHEMA_MISMATCH');
currentHeaders=headers.slice();rows=0;
assert.equal(run().state,'SCHEMA_MISMATCH');
rows=1;
assert.equal(run().canEnable,false);
console.log('Stage 38: administrator-only read-only journal preflight passed');

'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const headers=['ParentSubmissionID','SessionID','IntentJSON','Status','CreatedAt','CreatedBy'];
let account={Email:'admin@example.com',Role:'administrator',Status:'active',AssignedTeam:'A',TeamLocked:true};
let sheetReads=0;
const sheet={getLastRow:()=>{sheetReads++;return 1;},getLastColumn:()=>{sheetReads++;return 6;},
 getRange:()=>({getDisplayValues:()=>{sheetReads++;return [headers];}})};
const ctx=vm.createContext({
 SpreadsheetApp:{openById:()=>{sheetReads++;return {getSheetByName:()=>{sheetReads++;return sheet;}}}},
 Session:{getActiveUser:()=>({getEmail:()=>account.Email})},
});
for(const path of ['src/Code.gs','src/PalletJournalProvisioningReview.gs','src/PalletJournalAdminPreflight.gs'])
 vm.runInContext(fs.readFileSync(path,'utf8'),ctx);
vm.runInContext("invRows_=name=>name==='AppUsers'?[globalThis.__account]:[]",ctx);
ctx.__account=account;
const run=vm.runInContext('apiInventoryPalletJournalPreflight',ctx);
assert.equal(run().state,'EMPTY_READY_FOR_ADMIN_REVIEW');
assert.equal(run().canEnable,false);
for(const patch of [{Role:'counter'},{Status:'inactive'},{Email:''},{Role:'unknown'}]){
 ctx.__account={...account,...patch};account=ctx.__account;
 const before=sheetReads;
 assert.throws(()=>run());
 assert.equal(sheetReads,before,'rejected identity must not access spreadsheet');
}
console.log('Stage 40: real production administrator authentication gates read-only journal preflight');

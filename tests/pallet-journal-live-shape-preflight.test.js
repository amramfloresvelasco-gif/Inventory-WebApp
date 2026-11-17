'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const headers=['ParentSubmissionID','SessionID','IntentJSON','Status','CreatedAt','CreatedBy'];
const marker='TEST_ONLY_JOURNAL_20261116_STAGE41';
const data=[headers,[marker,'TEST_ONLY_NO_SESSION',JSON.stringify({testOnly:true,marker,
 purpose:'Journal storage read/write verification only; no pallet submission; no count children'}),
 'TEST_ONLY','2026-11-17T02:02:15.017Z','SYSTEM_TEST_NO_USER']];
let reads=0,admin=true;
const sheet={getLastRow:()=>{reads++;return data.length;},getLastColumn:()=>{reads++;return 6;},
 getRange:(r,c,h,w)=>({getDisplayValues:()=>{reads++;return data.slice(r-1,r-1+h).map(row=>row.slice(c-1,c-1+w));}})};
const ctx=vm.createContext({JSON,String,Number,Array,Object,Error,
 INV_DB_ID:'TEST',
 invRequireAdmin_:()=>{if(!admin)throw Error('Administrator permission required');},
 SpreadsheetApp:{openById:id=>{assert.equal(id,'TEST');reads++;return {getSheetByName:n=>{assert.equal(n,'PalletSubmissionJournal');reads++;return sheet;}}}}
});
for(const name of ['PalletJournalProvisioningReview','PalletJournalAdminPreflight','PalletJournalAuditReview'])
 vm.runInContext(fs.readFileSync('src/'+name+'.gs','utf8'),ctx);
const preflight=vm.runInContext('apiInventoryPalletJournalPreflight',ctx);
const auditReview=vm.runInContext('invPalletJournalAuditReview_',ctx);
const result=preflight();
assert.equal(result.state,'EXISTING_RECORDS_REVIEW');
assert.equal(result.lastRow,2);
assert.equal(result.lastColumn,6);
assert.equal(result.canEnable,false);
const row=Object.fromEntries(headers.map((key,i)=>[key,data[1][i]]));
const audit=auditReview([row]);
assert.equal(audit.state,'AUDIT_INSPECTED');
assert.equal(audit.stage41AuditRows,1);
assert.equal(audit.otherJournalRows,0);
assert.equal(audit.canEnable,false);
admin=false;
const before=reads;
assert.throws(()=>preflight(),/Administrator permission required/);
assert.equal(reads,before);
console.log('Stage 45: deployed journal layout remains review-only; counter denied before sheet read');

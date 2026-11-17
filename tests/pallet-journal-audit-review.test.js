'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({JSON,Object,String,Array,Error});
vm.runInContext(fs.readFileSync('src/PalletJournalAuditReview.gs','utf8'),ctx);
const decide=vm.runInContext('invPalletJournalAuditRowDecision_',ctx);
const review=vm.runInContext('invPalletJournalAuditReview_',ctx);
const marker='TEST_ONLY_JOURNAL_20261116_STAGE41';
const row={ParentSubmissionID:marker,SessionID:'TEST_ONLY_NO_SESSION',Status:'TEST_ONLY',
 CreatedBy:'SYSTEM_TEST_NO_USER',IntentJSON:JSON.stringify({testOnly:true,marker,
 purpose:'Journal storage read/write verification only; no pallet submission; no count children'})};
assert.equal(decide(row).state,'STAGE41_AUDIT_ONLY');
assert.equal(decide({...row,Status:'PREPARED'}).state,'AUDIT_ROW_TAMPERED');
assert.equal(decide({...row,IntentJSON:'{broken'}).state,'AUDIT_ROW_TAMPERED');
assert.equal(decide({...row,IntentJSON:JSON.stringify({...JSON.parse(row.IntentJSON),children:[]})}).state,'AUDIT_ROW_TAMPERED');
assert.equal(decide({...row,ParentSubmissionID:'real-parent'}).state,'NOT_STAGE41_AUDIT');
assert.equal(review([row]).stage41AuditRows,1);
assert.equal(review([row]).canEnable,false);
assert.equal(review([row,row]).state,'ADMIN_REVIEW_REQUIRED');
assert.equal(review([row,{...row,Status:'PREPARED'}]).state,'ADMIN_REVIEW_REQUIRED');
assert.equal(review([row,{ParentSubmissionID:'real-parent'}]).otherJournalRows,1);
console.log('Stage 42: exact audit-only record classification remains fail-closed');

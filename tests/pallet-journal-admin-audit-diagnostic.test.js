'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const marker='TEST_ONLY_JOURNAL_20261116_STAGE41';
const row={ParentSubmissionID:marker,SessionID:'TEST_ONLY_NO_SESSION',
 IntentJSON:JSON.stringify({testOnly:true,marker,purpose:'Journal storage read/write verification only; no pallet submission; no count children'}),
 Status:'TEST_ONLY',CreatedBy:'SYSTEM_TEST_NO_USER'};
let admin=false,reads=0,state='EXISTING_RECORDS_REVIEW',rows=[row];
const ctx=vm.createContext({JSON,Object,String,Array,Error,
 invRequireAdmin_:()=>{if(!admin)throw Error('Administrator permission required');},
 apiInventoryPalletJournalPreflight:()=>{reads++;return {state};},
 invPalletJournalRows_:()=>{reads++;return rows;}
});
for(const name of ['PalletJournalAuditReview','PalletJournalAdminAuditDiagnostic'])
 vm.runInContext(fs.readFileSync('src/'+name+'.gs','utf8'),ctx);
const run=vm.runInContext('apiInventoryPalletJournalAuditReview',ctx);
assert.throws(()=>run(),/Administrator permission required/);assert.equal(reads,0);
admin=true;
let result=run();
assert.equal(result.state,'AUDIT_INSPECTED');assert.equal(result.stage41AuditRows,1);
assert.equal(result.otherJournalRows,0);assert.equal(result.canEnable,false);
rows=[row,{...row,ParentSubmissionID:'REAL-01'}];
result=run();assert.equal(result.otherJournalRows,1);assert.equal(result.canEnable,false);
rows=[row,{...row,Status:'PREPARED'}];
result=run();assert.equal(result.state,'ADMIN_REVIEW_REQUIRED');assert.equal(result.tamperedAuditRows,1);
for(const blocked of ['MISSING','SCHEMA_MISMATCH','UNKNOWN_CONTENTS']){
 state=blocked;const before=reads;result=run();
 assert.equal(result.state,'PREFLIGHT_BLOCKED');assert.equal(result.canEnable,false);
 assert.equal(reads,before+1,'must not read rows after blocked preflight');
}
console.log('Stage 46: administrator audit diagnostic is read-only and never enables saving');

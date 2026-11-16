const assert=require('assert'),fs=require('fs'),vm=require('vm');
const ctx=vm.createContext({});
for(const file of ['src/ProductIndexPreview.gs','src/ProductIndexImportGuard.gs'])
  vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
const raw=[{RawMaterialId:'100',MaterialName:'Flavor',ClassOfMaterial:'Blending_Ingredient',UnitOfMeasure:'FluidOunces'}];
const fg=[{'Master Id':'200','Master Name':'Finished SKU'}];
const preview=ctx.invPreviewProductIndex_(raw,fg,[{WSItemID:'200',UnitsPerCase:6}]);
let result=ctx.invPrepareInitialProductIndex_(preview,[],'IMPORT_INITIAL_PRODUCT_INDEX');
assert.strictEqual(result.ready,true);
assert.strictEqual(result.addCount,2);
assert.strictEqual(result.products[0].DefaultUOM,'FluidOunces');
assert.strictEqual(result.products[1].UnitsPerCase,6);
assert.strictEqual(ctx.invVerifyInitialProductIndex_(result.products,result.products).ok,true);
assert.strictEqual(ctx.invPrepareInitialProductIndex_(preview,[],null).ready,false);
assert.strictEqual(ctx.invPrepareInitialProductIndex_(preview,preview.products,'IMPORT_INITIAL_PRODUCT_INDEX').ready,false);
assert.strictEqual(ctx.invPrepareInitialProductIndex_({...preview,ready:false},[],'IMPORT_INITIAL_PRODUCT_INDEX').ready,false);
assert.strictEqual(ctx.invVerifyInitialProductIndex_(result.products,result.products.slice(0,1)).ok,false);
assert.strictEqual(ctx.invVerifyInitialProductIndex_(result.products,[{...result.products[0],DefaultUOM:'Each'},result.products[1]]).ok,false);
assert.strictEqual(ctx.invVerifyInitialProductIndex_(result.products,[result.products[0],result.products[0]]).ok,false);
const stage=ctx.invStageInitialProductIndex_(preview,[],'IMPORT_INITIAL_PRODUCT_INDEX');
assert.strictEqual(stage.ready,true);
assert.strictEqual(stage.count,2);
assert.strictEqual(stage.rows[0][5],'FluidOunces');
assert.strictEqual(ctx.invVerifyStagedProductIndex_(stage,stage.headers,stage.rows).ok,true);
assert.strictEqual(ctx.invVerifyStagedProductIndex_(stage,stage.headers,stage.rows.slice(0,1)).ok,false);
assert.strictEqual(ctx.invVerifyStagedProductIndex_(stage,['Bad',...stage.headers.slice(1)],stage.rows).ok,false);
const tampered=stage.rows.map(r=>r.slice());tampered[1][4]=999;
assert.strictEqual(ctx.invVerifyStagedProductIndex_(stage,stage.headers,tampered).ok,false);
assert.strictEqual(ctx.invStageInitialProductIndex_(preview,[],null).ready,false);
assert.strictEqual(ctx.invStageInitialProductIndex_(preview,preview.products,'IMPORT_INITIAL_PRODUCT_INDEX').ready,false);
console.log('Initial ProductIndex guard and staging tests PASS');

// Locked server preflight: mocked services, no write APIs are exposed.
const calls=[];
const preflightCtx=vm.createContext({
  invRequireAdmin_:()=>({email:'admin@example.test'}),
  LockService:{getScriptLock:()=>({tryLock:()=>{calls.push('lock');return true;},releaseLock:()=>calls.push('unlock')})},
  invProductIndexFreshPlan_:()=>{calls.push('fresh');return {
    preview,existing:[],ready:true,issues:[],
    plan:{adds:preview.products,updates:[],unchanged:[],missing:[]}
  };},
  invPrepareInitialProductIndex_:ctx.invPrepareInitialProductIndex_,
  invStageInitialProductIndex_:ctx.invStageInitialProductIndex_,
  invPlanProductIndexSync_:ctx.invPlanProductIndexSync_
});
vm.runInContext(fs.readFileSync('src/ProductIndexImportPreflight.gs','utf8'),preflightCtx);
const dry=preflightCtx.apiInventoryAdminProductIndexImportPreflight();
assert.strictEqual(dry.readOnly,true);
assert.strictEqual(dry.importEnabled,false);
assert.strictEqual(dry.ready,true);
assert.strictEqual(dry.stagedRows,2);
assert.deepStrictEqual(calls,['lock','fresh','unlock']);
console.log('Locked ProductIndex dry-run preflight tests PASS');

vm.runInContext(fs.readFileSync('src/ProductIndexRecovery.gs','utf8'),ctx);
const assess=(rows,journal)=>ctx.invAssessInitialProductIndexRecovery_(stage,stage.headers,rows,journal);
assert.strictEqual(assess([]).state,'EMPTY');
assert.strictEqual(assess([]).safeToRetry,true);
assert.strictEqual(assess(stage.rows).state,'MATCHES_STAGE');
assert.strictEqual(assess(stage.rows).safeToRetry,false);
assert.strictEqual(assess(stage.rows.slice(0,1)).state,'REQUIRES_RECOVERY');
assert.strictEqual(assess(stage.rows.slice(0,1)).safeToRetry,false);
const extra=stage.rows.map(r=>r.slice());extra.push(['unrecognized','','','','','','','','']);
assert.strictEqual(assess(extra).foreign.length,1);
const corrupted=stage.rows.map(r=>r.slice());corrupted[0][1]='tampered';
assert.strictEqual(assess(corrupted).altered.length,1);
const repeated=stage.rows.map(r=>r.slice());repeated.push(stage.rows[0].slice());
assert.strictEqual(assess(repeated).duplicate.length,1);
assert.strictEqual(ctx.invAssessInitialProductIndexRecovery_(stage,['wrong'],stage.rows).state,'BLOCKED');
assert.strictEqual(assess(stage.rows.slice(0,1),{importId:'id',backupId:'backup'}).rollbackAuthorized,false);
assert.strictEqual(ctx.invInitialProductIndexAuditEvent_('id','PREPARED','admin',{}).phase,'PREPARED');
assert.throws(()=>ctx.invInitialProductIndexAuditEvent_('id','DELETE_ALL','admin',{}));
console.log('ProductIndex recovery and audit guard tests PASS');

vm.runInContext(fs.readFileSync('src/ProductIndexTransactionSimulator.gs','utf8'),ctx);
function mockAdapter(options={}){
 const state={headers:stage.headers.slice(),rows:[],events:[],backup:null};
 const adapter={
  snapshot:()=>({headers:state.headers.slice(),rows:state.rows.map(r=>r.slice())}),
  persistBackup:snapshot=>{if(options.backupFailure)throw Error('backup failed');state.backup=snapshot;return 'backup-1';},
  appendAudit:event=>{if(options.auditFailure&&event.phase===options.auditFailure)throw Error('audit failed');state.events.push(event.phase);},
  writeRows:rows=>{state.rows=rows.map(r=>r.slice());if(options.partialWrite){state.rows.pop();throw Error('injected partial write');}},
  readback:()=>({headers:state.headers.slice(),rows:state.rows.map(r=>r.slice())})
 };
 return {state,adapter};
}
let m=mockAdapter();
let outcome=ctx.invSimulateInitialProductIndexTransaction_(stage,'admin',m.adapter,'tx1');
assert.strictEqual(outcome.ok,true);
assert.strictEqual(m.state.rows.length,2);
assert.deepStrictEqual(m.state.events,['PREPARED','BACKUP_VERIFIED','WRITE_STARTED','WRITE_VERIFIED']);
m=mockAdapter({partialWrite:true});
outcome=ctx.invSimulateInitialProductIndexTransaction_(stage,'admin',m.adapter,'tx2');
assert.strictEqual(outcome.ok,false);
assert.strictEqual(outcome.recoveryRequired,true);
assert.strictEqual(m.state.rows.length,1);
assert.deepStrictEqual(m.state.events.slice(-2),['FAILED','RECOVERY_REQUIRED']);
assert.strictEqual(m.state.backup.rows.length,0);
m=mockAdapter({backupFailure:true});
assert.throws(()=>ctx.invSimulateInitialProductIndexTransaction_(stage,'admin',m.adapter,'tx3'),/backup failed/);
assert.strictEqual(m.state.rows.length,0);
m=mockAdapter({auditFailure:'WRITE_STARTED'});
outcome=ctx.invSimulateInitialProductIndexTransaction_(stage,'admin',m.adapter,'tx4');
assert.strictEqual(outcome.ok,false);
assert.strictEqual(m.state.rows.length,0);
m=mockAdapter();
m.state.rows.push(stage.rows[0].slice());
assert.throws(()=>ctx.invSimulateInitialProductIndexTransaction_(stage,'admin',m.adapter,'tx5'),/empty target/);
console.log('ProductIndex mock transaction and failure injection tests PASS');

vm.runInContext(fs.readFileSync('src/ProductIndexDurableEvidence.gs','utf8'),ctx);
const evidence={
 backup:{backupId:'immutable-backup-1',importId:'tx',actor:'admin',immutable:true,
   headers:stage.headers.slice(),rows:[]},
 journal:{importId:'tx',actor:'admin',backupId:'immutable-backup-1',durable:true,
   events:[{importId:'tx',actor:'admin',phase:'PREPARED'},
     {importId:'tx',actor:'admin',phase:'BACKUP_VERIFIED'}]}
};
assert.strictEqual(ctx.invValidateProductIndexEvidence_(stage,evidence.backup,evidence.journal,'tx','admin').ready,true);
assert.strictEqual(ctx.invVerifyProductIndexEvidenceReadback_(stage,evidence,evidence,'tx','admin').ready,true);
assert.strictEqual(ctx.invValidateProductIndexEvidence_(stage,{...evidence.backup,immutable:false},evidence.journal,'tx','admin').ready,false);
assert.strictEqual(ctx.invValidateProductIndexEvidence_(stage,evidence.backup,{...evidence.journal,durable:false},'tx','admin').ready,false);
assert.strictEqual(ctx.invValidateProductIndexEvidence_(stage,evidence.backup,{...evidence.journal,backupId:'wrong'},'tx','admin').ready,false);
assert.strictEqual(ctx.invValidateProductIndexEvidence_(stage,evidence.backup,{...evidence.journal,events:evidence.journal.events.slice(0,1)},'tx','admin').ready,false);
assert.strictEqual(ctx.invVerifyProductIndexEvidenceReadback_(stage,evidence,{...evidence,backup:{...evidence.backup,backupId:'different'}},'tx','admin').ready,false);
console.log('Durable ProductIndex evidence contract tests PASS');

const driveFiles=new Map(), driveFolder={
 getFilesByName:name=>{const items=[...driveFiles.values()].filter(f=>f.getName()===name);let i=0;return {hasNext:()=>i<items.length,next:()=>items[i++]};},
 createFile:(name,body)=>{const id='drive-'+(driveFiles.size+1);
  const file={getId:()=>id,getName:()=>name,getBlob:()=>({getDataAsString:()=>body})};
  driveFiles.set(id,file);return file;}
};
const crypto=require('crypto');
const driveCtx=vm.createContext({
 Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_alg,value)=>Array.from(crypto.createHash('sha256').update(value,'utf8').digest()).map(n=>n>127?n-256:n)},
 PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'folder-1'})},
 DriveApp:{getFolderById:()=>driveFolder,getFileById:id=>driveFiles.get(id)},
 invInitialProductIndexAuditEvent_:ctx.invInitialProductIndexAuditEvent_,
 invVerifyProductIndexEvidenceReadback_:ctx.invVerifyProductIndexEvidenceReadback_,
 invValidateProductIndexEvidence_:ctx.invValidateProductIndexEvidence_
});
vm.runInContext(fs.readFileSync('src/ProductIndexEvidenceIntegrity.gs','utf8'),driveCtx);
vm.runInContext(fs.readFileSync('src/ProductIndexEvidenceDrive.gs','utf8'),driveCtx);
const saved=driveCtx.invProductIndexPersistEvidenceDisabled_(stage,'admin','test-import-001',
 {headers:stage.headers,rows:[]});
assert.strictEqual(saved.verified,true);
assert.strictEqual(driveFiles.size,2);
assert.throws(()=>driveCtx.invProductIndexPersistEvidenceDisabled_(stage,'admin','test-import-001',
 {headers:stage.headers,rows:[]}),/already exists/);
assert.throws(()=>driveCtx.invProductIndexPersistEvidenceDisabled_(stage,'admin','test-import-002',
 {headers:stage.headers,rows:stage.rows}),/must be empty/);
console.log('ProductIndex Drive evidence mock tests PASS');

vm.runInContext(fs.readFileSync('src/ProductIndexAuditChain.gs','utf8'),ctx);
const chain=[];
for(const phase of ['PREPARED','BACKUP_VERIFIED','WRITE_STARTED','FAILED','RECOVERY_REQUIRED','RECOVERED'])
 chain.push(ctx.invProductIndexNextAuditEvent_(chain,'import-1','admin','event-'+(chain.length+1),phase,{}));
assert.strictEqual(ctx.invValidateProductIndexAuditChain_(chain,'import-1','admin').valid,true);
assert.strictEqual(ctx.invValidateProductIndexAuditChain_(chain.slice(0,3),'import-1','admin').valid,true);
const broken=chain.map(e=>({...e}));broken[2].previousEventId='wrong';
assert.strictEqual(ctx.invValidateProductIndexAuditChain_(broken,'import-1','admin').valid,false);
const reordered=chain.map(e=>({...e}));[reordered[1],reordered[2]]=[reordered[2],reordered[1]];
assert.strictEqual(ctx.invValidateProductIndexAuditChain_(reordered,'import-1','admin').valid,false);
assert.throws(()=>ctx.invProductIndexNextAuditEvent_(chain,'import-1','admin','event-7','WRITE_STARTED',{}));
assert.throws(()=>ctx.invProductIndexNextAuditEvent_(chain,'import-1','admin','event-6','PREPARED',{}));
console.log('ProductIndex append-only audit chain tests PASS');

driveFolder.getFiles=()=>{const items=[...driveFiles.values()];let i=0;return {hasNext:()=>i<items.length,next:()=>items[i++]};};
driveCtx.invProductIndexEvidenceFileName_=driveCtx.invProductIndexEvidenceFileName_;
driveCtx.invProductIndexEvidenceReadById_=driveCtx.invProductIndexEvidenceReadById_;
driveCtx.invProductIndexEvidenceWriteOnce_=driveCtx.invProductIndexEvidenceWriteOnce_;
driveCtx.invProductIndexNextAuditEvent_=ctx.invProductIndexNextAuditEvent_;
driveCtx.invValidateProductIndexAuditChain_=ctx.invValidateProductIndexAuditChain_;
vm.runInContext(fs.readFileSync('src/ProductIndexAuditDrive.gs','utf8'),driveCtx);
let eventResult=driveCtx.invProductIndexAppendAuditEventDisabled_(
 driveFolder,'audit-test-001','admin','evt-1','PREPARED',{count:2});
assert.strictEqual(eventResult.count,1);
eventResult=driveCtx.invProductIndexAppendAuditEventDisabled_(
 driveFolder,'audit-test-001','admin','evt-2','BACKUP_VERIFIED',{});
assert.strictEqual(eventResult.count,2);
assert.strictEqual(driveCtx.invProductIndexReadAuditEventsDisabled_(driveFolder,'audit-test-001','admin').length,2);
assert.throws(()=>driveCtx.invProductIndexAppendAuditEventDisabled_(
 driveFolder,'audit-test-001','admin','evt-3','PREPARED',{}),/transition/);
assert.throws(()=>driveCtx.invProductIndexAppendAuditEventDisabled_(
 driveFolder,'audit-test-001','admin','evt-2','WRITE_STARTED',{}),/Duplicate/);
const fakeName='product-index-audit-test-001-event-004.json';
driveFolder.createFile(fakeName,JSON.stringify({phase:'FAILED'}));
assert.throws(()=>driveCtx.invProductIndexReadAuditEventsDisabled_(driveFolder,'audit-test-001','admin'),/Missing, duplicate or unexpected/);
console.log('ProductIndex per-event Drive audit mock tests PASS');

const digestPayload={test:'integrity'};
const envelope=driveCtx.invProductIndexEvidenceEnvelope_(digestPayload);
assert.strictEqual(driveCtx.invProductIndexVerifyEvidenceEnvelope_(envelope).test,'integrity');
assert.throws(()=>driveCtx.invProductIndexVerifyEvidenceEnvelope_(
 {...envelope,payload:{test:'tampered'}}),/digest mismatch/);
const fileForTamper=driveFiles.get(saved.backupFileId);
const originalBlob=fileForTamper.getBlob;
fileForTamper.getBlob=()=>({getDataAsString:()=>JSON.stringify({
 ...JSON.parse(originalBlob().getDataAsString()),payload:{altered:true}
})});
assert.throws(()=>driveCtx.invProductIndexEvidenceReadById_(driveFolder,
 saved.backupFileId,'product-index-test-import-001-backup.json'),/digest mismatch/);
console.log('ProductIndex SHA-256 integrity tampering tests PASS');

vm.runInContext(fs.readFileSync('src/ProductIndexEvidenceAccessPolicy.gs','utf8'),ctx);
const owner=[{type:'user',role:'owner',emailAddress:'admin@example.test'}];
assert.strictEqual(ctx.invProductIndexEvidenceAccessCheck_(owner,true).ready,true);
assert.strictEqual(ctx.invProductIndexEvidenceAccessCheck_(owner,false).ready,false);
assert.strictEqual(ctx.invProductIndexEvidenceAccessCheck_([...owner,{type:'anyone',role:'reader'}],true).ready,false);
assert.strictEqual(ctx.invProductIndexEvidenceAccessCheck_([...owner,{type:'domain',role:'reader'}],true).ready,false);
assert.strictEqual(ctx.invProductIndexEvidenceAccessCheck_([...owner,{type:'group',role:'writer'}],true).ready,false);
assert.strictEqual(ctx.invProductIndexEvidenceAccessCheck_([],true).ready,false);
const raceName='product-index-race-test-001-backup.json';
const originalCreate=driveFolder.createFile;
driveFolder.createFile=(name,body)=>{
 const result=originalCreate(name,body);
 if(name===raceName)originalCreate(name,body);
 return result;
};
assert.throws(()=>driveCtx.invProductIndexEvidenceWriteOnce_(driveFolder,raceName,{test:true}),/collision/);
driveFolder.createFile=originalCreate;
console.log('ProductIndex folder policy and concurrent filename collision tests PASS');

const inspectCtx=vm.createContext({
 PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'folder-1'})},
 invProductIndexEvidenceAccessCheck_:ctx.invProductIndexEvidenceAccessCheck_
});
vm.runInContext(fs.readFileSync('src/ProductIndexEvidencePermissionInspection.gs','utf8'),inspectCtx);
assert.strictEqual(inspectCtx.invInspectProductIndexEvidenceFolderDisabled_().ready,false);
inspectCtx.Drive={Permissions:{list:()=>({permissions:[{type:'user',role:'owner',emailAddress:'admin@example.test'}]})}};
const inspected=inspectCtx.invInspectProductIndexEvidenceFolderDisabled_();
assert.strictEqual(inspected.inspectionComplete,true);
assert.strictEqual(inspected.policyReady,true);
assert.strictEqual(inspected.ready,false); // inherited access still requires review
inspectCtx.Drive={Permissions:{list:()=>({permissions:[{type:'anyone',role:'reader'}]})}};
assert.strictEqual(inspectCtx.invInspectProductIndexEvidenceFolderDisabled_().policyReady,false);
inspectCtx.Drive={Permissions:{list:()=>{throw Error('forbidden');}}};
assert.strictEqual(inspectCtx.invInspectProductIndexEvidenceFolderDisabled_().inspectionComplete,false);
console.log('Read-only Drive permissions inspection fail-closed tests PASS');

vm.runInContext(fs.readFileSync('src/ProductIndexImportAuthorizationReview.gs','utf8'),ctx);
const approvalBase={
 adminVerified:true,actor:'admin@example.test',preflightReady:true,existingRows:0,
 stagedRows:748,sourceFingerprintVerified:true,evidenceBackupVerified:true,
 auditChainVerified:true,permissionInspectionComplete:true,
 permissionPolicyReady:true,inheritedAccessReviewed:true,lockHeld:true,
 operatorAcknowledgedRisks:true,explicitApprovalRecorded:true
};
const review=ctx.invProductIndexImportAuthorizationReview_(approvalBase);
assert.strictEqual(review.readyForHumanReview,true);
assert.strictEqual(review.importEnabled,false);
assert.strictEqual(ctx.invProductIndexImportAuthorizationReview_({...approvalBase,
 existingRows:1}).readyForHumanReview,false);
assert.strictEqual(ctx.invProductIndexImportAuthorizationReview_({...approvalBase,
 inheritedAccessReviewed:false}).readyForHumanReview,false);
assert.strictEqual(ctx.invProductIndexImportAuthorizationReview_({...approvalBase,
 explicitApprovalRecorded:false}).readyForHumanReview,false);
assert.strictEqual(ctx.invProductIndexImportAuthorizationReview_(null).importEnabled,false);
console.log('ProductIndex authorization review fail-closed tests PASS');

driveCtx.invProductIndexSha256_=driveCtx.invProductIndexSha256_;
vm.runInContext(fs.readFileSync('src/ProductIndexStageFingerprint.gs','utf8'),driveCtx);
const fingerprint=driveCtx.invProductIndexStageFingerprint_(stage);
assert.strictEqual(fingerprint.count,stage.rows.length);
assert.strictEqual(driveCtx.invProductIndexVerifyStageFingerprint_(stage,fingerprint).ok,true);
const modifiedStage={...stage,rows:stage.rows.map(row=>[...row])};
modifiedStage.rows[0][1]=String(modifiedStage.rows[0][1])+' changed';
assert.strictEqual(driveCtx.invProductIndexVerifyStageFingerprint_(modifiedStage,fingerprint).ok,false);
const reorderedStage={...stage,rows:[...stage.rows].reverse()};
if(stage.rows.length>1)assert.strictEqual(driveCtx.invProductIndexVerifyStageFingerprint_(reorderedStage,fingerprint).ok,false);
assert.strictEqual(driveCtx.invProductIndexVerifyStageFingerprint_(stage,null).ok,false);
assert.throws(()=>driveCtx.invProductIndexStageFingerprint_({...stage,count:-1}),/Valid complete/);
console.log('ProductIndex staged fingerprint tests PASS');

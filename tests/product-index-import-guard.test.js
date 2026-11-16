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

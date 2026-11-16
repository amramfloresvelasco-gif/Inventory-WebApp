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

/**
 * Controlled INITIAL ProductIndex import gate (pure checks only).
 * This module deliberately has no SpreadsheetApp writes and no public import RPC.
 * A later server-side adapter must re-read WS/SPIRITS sources under lock and
 * obtain explicit operator approval before calling any writer.
 */
function invPrepareInitialProductIndex_(preview, existingRows, approval) {
  const issues = [];
  const plan = invPlanProductIndexSync_(preview, existingRows);
  if (!plan.ready) issues.push(...plan.issues);
  if (!Array.isArray(existingRows) || existingRows.length !== 0)
    issues.push({reason:'Initial import requires an empty ProductIndex; never overwrite existing records'});
  if (!preview || !preview.ready || !Array.isArray(preview.products))
    issues.push({reason:'Fresh source validation is required'});
  if (plan.updates.length || plan.missing.length || plan.unchanged.length)
    issues.push({reason:'Initial import cannot update, remove or reuse existing products'});
  if (plan.adds.length !== (preview && preview.products || []).length)
    issues.push({reason:'Initial import must contain every validated source product'});
  const products = preview && Array.isArray(preview.products) ? preview.products : [];
  for (const p of products) {
    if (!p.WSItemID || !p.ItemName || !p.Barcode || !p.Source)
      issues.push({id:p.WSItemID,reason:'Missing required product fields'});
    if (p.Source === 'WS Finished Goods' &&
        (!Number.isSafeInteger(Number(p.UnitsPerCase)) || Number(p.UnitsPerCase) <= 0))
      issues.push({id:p.WSItemID,reason:'Unverified FG case pack'});
    // Never reject legacy blending UOM: preserve its exact source value.
    if (p.Source === 'WS Raw Materials' && !String(p.DefaultUOM || '').trim())
      issues.push({id:p.WSItemID,reason:'Missing raw material UOM'});
  }
  const confirmed = approval === 'IMPORT_INITIAL_PRODUCT_INDEX';
  if (!confirmed) issues.push({reason:'Explicit initial import confirmation required'});
  return {ready:issues.length === 0,issues,addCount:plan.adds.length,
    updateCount:plan.updates.length,missingCount:plan.missing.length,
    products:issues.length ? [] : plan.adds.map(p=>({...p}))};
}

/**
 * Validate a post-write readback before declaring success. The caller must
 * compare all columns, not only row count. Failed verification requires
 * rollback/recovery and must never be reported as a completed import.
 */
function invVerifyInitialProductIndex_(expected, actual) {
  const fields=['WSItemID','ItemName','ClassOfMaterial','Barcode',
    'UnitsPerCase','DefaultUOM','Source','SourceUpdatedAt','Active'];
  if (!Array.isArray(expected) || !Array.isArray(actual) ||
      expected.length !== actual.length)
    return {ok:false,reason:'Row count differs from validated import'};
  const seen=new Set();
  for(let i=0;i<expected.length;i++) {
    const a=actual[i],e=expected[i],id=String(a.WSItemID||'').trim();
    if(!id || seen.has(id))return {ok:false,reason:'Duplicate or missing readback ID'};
    seen.add(id);
    if(fields.some(k=>String(a[k]??'')!==String(e[k]??'')))
      return {ok:false,reason:'Readback mismatch at row '+(i+2)};
  }
  return {ok:true,count:actual.length};
}

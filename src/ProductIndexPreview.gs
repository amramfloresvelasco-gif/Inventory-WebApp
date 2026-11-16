/** Read-only import preparation. Never writes ProductIndex or filters by SPIRITS planner status. */
function invPreviewProductIndex_(rawRows,fgRows,casePacks) {
  const issues=[], products=[], byId=new Map(), byBarcode=new Map();
  function add(row,source) {
    const id=String(row.WSItemID||'').trim(), name=String(row.ItemName||'').trim();
    const barcode=String(row.Barcode||'').trim();
    if(!id||!name||!barcode){issues.push({source,id,reason:'Missing product ID, name or barcode'});return;}
    const scopedId=source+'|'+id;
    const existing=byId.get(scopedId);
    if(existing) {
      if(existing.ItemName!==name||existing.Barcode!==barcode||existing.ClassOfMaterial!==row.ClassOfMaterial||String(existing.UnitsPerCase)!==String(row.UnitsPerCase))
        issues.push({source,id,reason:'Conflicting records for the same WS item ID'});
      return;
    }
    if(byBarcode.has(barcode)&&byBarcode.get(barcode)!==scopedId)
      issues.push({source,id,reason:'Scan payload shared by multiple WS item IDs'});
    byBarcode.set(barcode,scopedId);
    byId.set(scopedId,row);products.push(row);
  }
  for(const r of rawRows) {
    const cls=String(r.ClassOfMaterial||'').toUpperCase().replace(/[^A-Z]/g,'');
    if(!['PACKAGING','BLENDINGINGREDIENT'].includes(cls))continue;
    const id=String(r.RawMaterialId||'').trim();
    add({WSItemID:id,ItemName:String(r.MaterialName||'').trim(),
      ClassOfMaterial:cls==='PACKAGING'?'Packaging':'Blending Ingredient',
      Barcode:id,UnitsPerCase:'',DefaultUOM:String(r.UnitOfMeasure||'').trim(),
      Source:'WS Raw Materials',SourceUpdatedAt:'',Active:true},'raw');
  }
  const packs=new Map();
  for(const p of casePacks) {
    const id=String(p.WSItemID||'').trim();
    const pack=Number(p.UnitsPerCase);
    if(!id||!Number.isSafeInteger(pack)||pack<=0) {
      issues.push({source:'SPIRITS',id,reason:'Missing or invalid bottles per case'});continue;
    }
    if(packs.has(id)&&packs.get(id)!==pack)
      issues.push({source:'SPIRITS',id,reason:'Conflicting bottles-per-case values'});
    else packs.set(id,pack);
  }
  for(const r of fgRows) {
    const id=String(r['Master Id']||'').trim(),name=String(r['Master Name']||'').trim();
    if(!packs.has(id))issues.push({source:'FG',id,reason:'Bottles per case not verified'});
    add({WSItemID:id,ItemName:name,ClassOfMaterial:'Finished Good',
      Barcode:name,UnitsPerCase:packs.get(id)||'',DefaultUOM:'Case',
      Source:'WS Finished Goods',SourceUpdatedAt:'',Active:true},'FG');
  }
  return {products,issues,ready:issues.length===0,
    counts:{products:products.length,raw:products.filter(p=>p.Source==='WS Raw Materials').length,
      finishedGoods:products.filter(p=>p.Source==='WS Finished Goods').length}};
}

/**
 * Build verified FG case-pack rows from the SPIRITS catalog.
 * Prefer the direct subtype ID; for legacy products with blank SubtypeID,
 * resolve the saved release's ReleaseType within the product's brand.
 * Never filter on any planner Status field. Flag ambiguous/missing joins.
 */
function invResolveSpiritsCasePacks_(products, releases, subtypes) {
  const issues=[],rows=[],byProduct=new Map(),bySubtype=new Map(),byBrandName=new Map(),byWsId=new Map();
  const norm=v=>String(v==null?'':v).trim().replace(/\s+/g,' ').toUpperCase();
  for(const t of subtypes) {
    const id=String(t.BrandReleaseTypeID||'').trim();
    if(id)bySubtype.set(id,t);
    const key=String(t.BrandID||'').trim()+'|'+norm(t.ReleaseTypeName);
    if(!byBrandName.has(key))byBrandName.set(key,[]);
    byBrandName.get(key).push(t);
  }
  for(const p of products) {
    const id=String(p.ProductID||'').trim();
    if(id&&byProduct.has(id))issues.push({product:p.ProductName,reason:'Duplicate SPIRITS ProductID'});
    if(id)byProduct.set(id,p);
    const wsid=String(p.WSFinishedGoodsID||'').trim();
    if(wsid){if(byWsId.has(wsid))issues.push({id:wsid,product:p.ProductName,reason:'Duplicate WS finished-good ID in SPIRITS'});else byWsId.set(wsid,p);}
  }
  const releaseByProduct=new Map();
  for(const r of releases) {
    const id=String(r.ProductID||'').trim();
    if(!releaseByProduct.has(id))releaseByProduct.set(id,[]);
    releaseByProduct.get(id).push(r);
  }
  for(const p of products) {
    const wsid=String(p.WSFinishedGoodsID||'').trim();
    if(!wsid){issues.push({product:p.ProductName,reason:'Missing WS finished-good ID'});continue;}
    let t=bySubtype.get(String(p.SubtypeID||'').trim());
    const linkedReleases=releaseByProduct.get(String(p.ProductID||'').trim())||[];
    const releaseMatches=new Map();
    for(const r of linkedReleases){
      for(const candidate of byBrandName.get(String(p.BrandID||'').trim()+'|'+norm(r.ReleaseType))||[])
        releaseMatches.set(String(candidate.BrandReleaseTypeID),candidate);
    }
    if(t&&releaseMatches.size&&(!releaseMatches.has(String(t.BrandReleaseTypeID))||releaseMatches.size!==1)){
      issues.push({id:wsid,product:p.ProductName,reason:'Product SubtypeID conflicts with Releases.ReleaseType'});continue;
    }
    if(t&&linkedReleases.some(r=>String(r.ReleaseType||'').trim())&&!releaseMatches.size){
      issues.push({id:wsid,product:p.ProductName,reason:'Release subtype name cannot be resolved'});continue;
    }
    if(!t) {
      const found=releaseMatches;
      if(found.size===1)t=[...found.values()][0];
      else {issues.push({id:wsid,product:p.ProductName,reason:found.size?'Ambiguous subtype via release':'Missing subtype relationship'});continue;}
    }
    if(String(t.BrandID)!==String(p.BrandID)){
      issues.push({id:wsid,product:p.ProductName,reason:'Subtype belongs to another brand'});continue;
    }
    const pack=Number(t.UnitsPerCase);
    if(t.UnitsPerCase===''||t.UnitsPerCase==null||!Number.isSafeInteger(pack)||pack<=0){
      issues.push({id:wsid,product:p.ProductName,reason:'Missing/invalid subtype bottles per case'});continue;
    }
    const productPack=Number(p.UnitsPerCase);
    if(p.UnitsPerCase!==''&&p.UnitsPerCase!=null&&Number.isSafeInteger(productPack)&&productPack>0&&productPack!==pack){
      issues.push({id:wsid,product:p.ProductName,reason:'Product/subtype case-pack conflict',productPack,subtypePack:pack});continue;
    }
    rows.push({WSItemID:wsid,UnitsPerCase:pack,SubtypeID:String(t.BrandReleaseTypeID)});
  }
  return {rows,issues,ready:issues.length===0};
}

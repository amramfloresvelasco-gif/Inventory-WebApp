/** Read-only import preparation. Never writes ProductIndex or filters by SPIRITS planner status. */
function invPreviewProductIndex_(rawRows,fgRows,casePacks) {
  const issues=[], products=[], byId=new Map(), byBarcode=new Map();
  function add(row,source) {
    const id=String(row.WSItemID||'').trim(), name=String(row.ItemName||'').trim();
    const barcode=String(row.Barcode||'').trim();
    if(!id||!name||!barcode){issues.push({source,id,reason:'Missing product ID, name or barcode'});return;}
    const existing=byId.get(id);
    if(existing) {
      if(existing.ItemName!==name||existing.Barcode!==barcode||existing.ClassOfMaterial!==row.ClassOfMaterial)
        issues.push({source,id,reason:'Conflicting records for the same WS item ID'});
      return;
    }
    if(byBarcode.has(barcode)&&byBarcode.get(barcode)!==id)
      issues.push({source,id,reason:'Scan payload shared by multiple WS item IDs'});
    byBarcode.set(barcode,id);
    byId.set(id,row);products.push(row);
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

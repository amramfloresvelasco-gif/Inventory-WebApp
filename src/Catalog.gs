/** Read-only SPIRITS catalog discovery and guarded import.
 * Source is NEVER written. Preview is available to an administrator only.
 * Deliberately does not auto-import until ID conflicts have been reviewed.
 */
const INV_SPIRITS_ID='1fll-r__z9DWWehswc-eaOyYMuO2zdFoWzksNqAtIZj8';
function invSourceRows_(name,cols) {
  const s=SpreadsheetApp.openById(INV_SPIRITS_ID).getSheetByName(name);
  if(!s) throw new Error('Missing SPIRITS source tab '+name);
  const last=s.getLastRow();
  if(last<2)return [];
  const data=s.getRange(1,1,last,cols).getDisplayValues();
  const headers=data.shift();
  return data.filter(row=>row.some(Boolean)).map(row=>Object.fromEntries(headers.map((h,i)=>[h,row[i]])));
}
function invCatalogPreview_() {
  const materialRows=invSourceRows_('Material Reference',3);
  const productRows=invSourceRows_('Products',12);\n  const countWarehouses=invSourceRows_('RawMaterialWarehouses',6)\n    .filter(r=>String(r.Counts).toUpperCase()==='TRUE'&&String(r.Active).toUpperCase()==='TRUE');
  const catalog=new Map(), conflicts=[], missing=[];
  function add(id,name,cls,uom,units,source) {
    id=String(id||'').trim();name=String(name||'').trim();
    if(!id||!name){missing.push({source,id,name});return;}
    const item={id,name,className:cls,uom,unitsPerCase:units||'',source};
    if(catalog.has(id)){
      const existing=catalog.get(id);
      if(existing.name!==name||existing.className!==cls)
        conflicts.push({id,existing,item});
      return;
    }
    catalog.set(id,item);
  }
  for(const row of materialRows) {
    const category=String(row.Category||'').trim().toLowerCase();
    if(!['packaging','ingredients','bulk'].includes(category)) {
      missing.push({source:'Material Reference',id:row['Material ID'],reason:'Unrecognized category: '+category});
      continue;
    }
    const cls=category==='packaging'?'Packaging':'Raw Material';
    add(row['Material ID'],row['Material Name'],cls,'Each','', 'Material Reference');
  }
  for(const row of productRows) {
    if(String(row.Status||'').trim().toLowerCase()!=='active')continue;
    const units=Number(row.UnitsPerCase);
    if(!Number.isSafeInteger(units)||units<=0){
      missing.push({source:'Products',id:row.WSFinishedGoodsID,reason:'Invalid UnitsPerCase'});continue;
    }
    add(row.WSFinishedGoodsID,row.WSFinishedGoodName||row.ProductName,
      'Finished Good','Case',units,'Products');
  }
  return {items:[...catalog.values()],conflicts,missing,sourceRows:{
    materialReference:materialRows.length,products:productRows.length,\n    countingWarehouses:countWarehouses.map(r=>({id:r.WarehouseID,name:r.WarehouseName}))}};
}
/** Only warehouses marked Counts=TRUE and Active=TRUE are eligible
 * for physical inventory and WS snapshot reconciliation. */
function invCountingWarehouseIds_() {
  return new Set(invSourceRows_('RawMaterialWarehouses',6)
    .filter(r=>String(r.Counts).toUpperCase()==='TRUE'&&String(r.Active).toUpperCase()==='TRUE')
    .map(r=>String(r.WarehouseID).trim()));
}
function apiInventoryAdminCatalogPreview() {
  invRequireAdmin_();
  const preview=invCatalogPreview_();
  return {sourceRows:preview.sourceRows,uniqueItems:preview.items.length,
    conflicts:preview.conflicts.slice(0,100),missing:preview.missing.slice(0,100),
    importReady:preview.conflicts.length===0&&preview.missing.length===0};
}
/** Explicit admin action. Rejects ALL ambiguous source mappings. */
function apiInventoryAdminImportCatalog() {
  const admin=invRequireAdmin_();
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw new Error('Busy; retry.');
  try{
    const p=invCatalogPreview_();
    if(p.conflicts.length||p.missing.length)
      throw new Error('Catalog has ambiguous/missing source records; inspect preview first.');
    const sheet=invSheet_('ProductIndex');
    if(sheet.getLastRow()>1)throw new Error('ProductIndex already populated. Refusing overwrite.');
    const rows=p.items.map(item=>[item.id,item.name,item.className,'',item.unitsPerCase,
      item.uom,item.source,new Date(),true]);
    if(rows.length)sheet.getRange(2,1,rows.length,9).setValues(rows);
    CacheService.getScriptCache().remove('inv_reference_v1');
    return {ok:true,imported:rows.length,by:admin.email};
  }finally{lock.releaseLock();}
}

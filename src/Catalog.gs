/** Read-only SPIRITS catalog discovery and guarded import.
 * Source is NEVER written. Preview is available to an administrator only.
 * Deliberately does not auto-import until ID conflicts have been reviewed.
 */
const INV_RAW_UOMS=['Each','Pounds','Gallons'];
/** Legacy UOM is never converted to a different unit. It contributes zero. */
function invNormalizeRawQuantity_(uom,quantity) {
  const unit=String(uom||'').trim();
  const n=Number(quantity);
  if(!Number.isFinite(n))throw new Error('Invalid WS quantity.');
  return INV_RAW_UOMS.includes(unit)?n:0;
}
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
  const productRows=invSourceRows_('Products',12);
  const materialDetails=invSourceRows_('Materials',10);
  const detailByWsId=new Map(materialDetails.filter(r=>r.WSRawMaterialID).map(r=>[String(r.WSRawMaterialID).trim(),r]));
  // Read-only legacy WS snapshot is diagnostic only, never an import authority.
  // Its age has not been verified, so it must not silently supply official UOM.
  const legacy=SpreadsheetApp.openById('13TdeoVaNFGD8E-eEREhuW1QBhzg1QtDFSWkeKQXs5rQ')
    .getSheetByName('WSFRM');
  const legacyRows=legacy&&legacy.getLastRow()>1 ?
    legacy.getRange(2,1,legacy.getLastRow()-1,18).getDisplayValues():[];
  const legacyUom=new Map(), legacyClass=new Map(), legacyConflicts=new Set();
  legacyRows.forEach(r=>{
    const id=String(r[1]||'').trim(),uom=String(r[8]||'').trim();
    if(!id||!uom)return;
    if(legacyUom.has(id)&&legacyUom.get(id)!==uom)legacyConflicts.add(id);
    legacyUom.set(id,uom);\n    const cls=String(r[10]||'').trim();\n    if(cls)legacyClass.set(id,cls);
  });
  const diagnostic={legacyMatches:0,legacyMissing:0,legacyConflicts:0,
    missingByCategory:{},legacyUomExamples:[]};
  const countWarehouses=invSourceRows_('RawMaterialWarehouses',6)
    .filter(r=>String(r.Counts).toUpperCase()==='TRUE'&&String(r.Active).toUpperCase()==='TRUE');
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
    const id=String(row['Material ID']).trim();
    const detail=detailByWsId.get(id);
    const uom=String(detail&&detail.UOM||'').trim();\n    if(uom&&!INV_RAW_UOMS.includes(uom))\n      missing.push({source:'Materials',id,reason:'Unsupported material UOM: '+uom});
    // Do not invent UOM. Material Reference has no UOM and Materials may be empty.
    if(!uom) {
      const candidate=legacyUom.get(id);
      if(candidate&&!legacyConflicts.has(id)) {
        diagnostic.legacyMatches++;
        if(diagnostic.legacyUomExamples.length<8)
          diagnostic.legacyUomExamples.push({id,candidateUOM:candidate});
      } else {
        diagnostic.legacyMissing++;
        if(legacyConflicts.has(id))diagnostic.legacyConflicts++;
        diagnostic.missingByCategory[category]=(diagnostic.missingByCategory[category]||0)+1;
      }
      missing.push({source:'Materials',id,reason:'Missing verified official UOM',
        candidateUOM:candidate||''});
    }
    if(String(legacyClass.get(id)||'').trim().toLowerCase()==='fermentation_support') {\n      diagnostic.fermentationExcluded=(diagnostic.fermentationExcluded||0)+1;\n      // Remove any missing-UOM issue for excluded fermentation records.\n      for(let i=missing.length-1;i>=0;i--)if(String(missing[i].id)===id)missing.splice(i,1);\n      continue;\n    }\n    add(id,row['Material Name'],cls,uom,'','Material Reference');
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
  return {items:[...catalog.values()],conflicts,missing,diagnostic,sourceRows:{
    materialReference:materialRows.length,materialDetails:materialDetails.length,products:productRows.length,
    countingWarehouses:countWarehouses.map(r=>({id:r.WarehouseID,name:r.WarehouseName}))}};
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
    conflicts:preview.conflicts.slice(0,100),missing:preview.missing.slice(0,30),
    diagnostic:preview.diagnostic,
    missingCount:preview.missing.length,conflictCount:preview.conflicts.length,
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

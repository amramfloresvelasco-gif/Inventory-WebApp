/** WS snapshot validation and immutable import. No live WS source is modified. */
const INV_WS_HEADERS=['SnapshotID','WSItemID','Warehouse','UOM','Quantity','ItemName','ClassOfMaterial'];
function invWsSnapshotPreview_(rows) {
  if(!Array.isArray(rows)||rows.length>20000)throw new Error('Invalid WS row batch.');
  const allowed=invCountingWarehouseIds_(), accepted=[], rejected=[], excluded={warehouse:0,fermentation:0};
  rows.forEach((r,i)=>{
    const id=String(r.WSItemID||r.RawMaterialId||r.MasterId||'').trim();
    const warehouse=String(r.WarehouseId||r.WarehouseID||r.Warehouse||'').trim();
    const cls=String(r.ClassOfMaterial||r.ClassOfMaterial_Name||'').trim();
    if(!allowed.has(warehouse)){excluded.warehouse++;return;}
    if(invIsExcludedMaterialClass_(cls)){excluded.fermentation++;return;}
    const raw=!['finished good','finished_goods','finishedgoods'].includes(cls.toLowerCase());
    const uom=String(r.UnitOfMeasure||r.UOM||'').trim();
    const sourceQuantity=r.Units!==undefined?r.Units:r.Quantity;
    const n=sourceQuantity===null||sourceQuantity===undefined||String(sourceQuantity).trim()===''?NaN:Number(sourceQuantity);
    if(!id||!uom||!Number.isFinite(n)||n<0){
      rejected.push({row:i+1,id,reason:'Missing ID/UOM or invalid quantity'});return;
    }
    if(!raw&&!['Case','Bottle'].includes(uom)){
      rejected.push({row:i+1,id,reason:'Unsupported finished goods UOM'});return;
    }
    const effective=raw?invNormalizeRawQuantity_(uom,n):n;
    accepted.push({id,warehouse,uom,quantity:effective,originalQuantity:n,
      itemName:String(r.MaterialName||r.ItemName||r.MasterName||'').slice(0,200),
      classOfMaterial:cls,legacyZero:raw&&!INV_RAW_UOMS.includes(uom)});
  });
  return {accepted,rejected,excluded,legacyZeroCount:accepted.filter(x=>x.legacyZero).length};
}
function apiInventoryAdminPreviewWSSnapshot(input) {
  invRequireAdmin_();
  const p=invWsSnapshotPreview_(input&&input.rows);
  return {accepted:p.accepted.length,rejected:p.rejected.slice(0,50),
    rejectedCount:p.rejected.length,excluded:p.excluded,
    legacyZeroCount:p.legacyZeroCount};
}
/** Initial original WS snapshot: admin-only, immutable, no overwrite. */
function apiInventoryAdminSaveOriginalWSSnapshot(input) {
  const admin=invRequireAdmin_(),sessionId=String(input&&input.sessionId||'').trim();
  const sourceTimestamp=String(input&&input.sourceTimestamp||'').trim();
  if(!sourceTimestamp)throw new Error('Source timestamp required.');
  // Event-driven only: this function is invoked explicitly for a created OPEN session.
  // Never install a time-based trigger for snapshot collection.
  if(!input||!Array.isArray(input.rows)||!input.rows.length)
    throw new Error('WS rows required.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw new Error('Busy; retry.');
  try {
    invSession_(sessionId);
    const p=invWsSnapshotPreview_(input.rows);
    if(p.rejected.length)throw new Error('WS snapshot has '+p.rejected.length+' invalid rows.');
    if(!p.accepted.length)throw new Error('No eligible WS rows.');
    const sessions=invSheet_('InventorySessions');
    const all=invRows_('InventorySessions');
    const index=all.findIndex(x=>String(x.SessionID)===sessionId);
    if(index<0)throw new Error('Session not found.');
    if(String(all[index].OriginalWSSnapshotID||'').trim())
      throw new Error('Original WS snapshot already assigned; immutable.');
    const snapshots=invSheet_('WSSnapshots'),ws=invSheet_('WSRows');
    if(invRows_('WSSnapshots').some(x=>String(x.SessionID)===sessionId&&String(x.SnapshotType).toUpperCase()==='ORIGINAL'))
      throw new Error('Original WS snapshot already exists for session.');
    const snapshotId='WS-'+Utilities.getUuid();
    // Preserve source quantity and source UOM in WSRows; normalize only during reconciliation.
    // Commit rows first, then metadata and session pointer.
    const values=p.accepted.map(x=>[snapshotId,x.id,x.warehouse,x.uom,x.originalQuantity,
      x.itemName,x.classOfMaterial]);
    // Sheets write limits: chunk source rows, no timer or background sync.
    const first=ws.getLastRow()+1;
    for(let offset=0;offset<values.length;offset+=500){
      const chunk=values.slice(offset,offset+500);
      ws.getRange(first+offset,1,chunk.length,7).setValues(chunk);
    }
    snapshots.getRange(snapshots.getLastRow()+1,1,9).setValues([[
      snapshotId,sessionId,'ORIGINAL',new Date(),admin.email,sourceTimestamp,1,'ACTIVE',
      'Source quantities preserved; Eligible '+values.length+'; excluded warehouse '+p.excluded.warehouse+
      '; fermentation '+p.excluded.fermentation+'; legacy UOM zero '+p.legacyZeroCount
    ]]);
    sessions.getRange(index+2,8).setValue(snapshotId);
    return {ok:true,snapshotId,imported:values.length,excluded:p.excluded,
      legacyZeroCount:p.legacyZeroCount};
  }finally{lock.releaseLock();}
}

/**
 * Extended-report-only legacy UOM watchlist. Read-only and source-preserving.
 * Uses ORIGINAL source quantities; never treats unsupported UOM as countable.
 */
function invExtendedOwnershipExcluded_(name, tokens) {
  const words=String(name||'').toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  const set=new Set(words);
  return (tokens||[]).some(token=>set.has(String(token||'').trim().toUpperCase()));
}
function invExtendedLegacyUomWatchlist_(rows, exclusionTokens) {
  if(!Array.isArray(rows))throw new Error('Invalid source rows.');
  const grouped=new Map();
  for(const r of rows) {
    const cls=String(r.ClassOfMaterial||r.classOfMaterial||'').toUpperCase().replace(/[^A-Z]/g,'');
    if(cls!=='BLENDINGINGREDIENT')continue;
    if(invExtendedOwnershipExcluded_(r.MaterialName||r.ItemName||r.itemName,exclusionTokens))continue;
    const uom=String(r.UnitOfMeasure||r.UOM||r.uom||'').trim();
    if(['Each','Pounds','Gallons'].includes(uom))continue;
    const id=String(r.RawMaterialId||r.WSItemID||r.id||'').trim();
    const warehouse=String(r.WarehouseId||r.Warehouse||r.warehouse||'').trim();
    const value=r.Units!==undefined?r.Units:(r.originalQuantity!==undefined?r.originalQuantity:r.Quantity);
    const quantity=Number(value);
    if(!id||!uom||value==null||String(value).trim()===''||!Number.isFinite(quantity))
      throw new Error('Invalid legacy UOM source record.');
    const key=JSON.stringify([id,uom,warehouse]);
    if(!grouped.has(key))grouped.set(key,{WSItemID:id,ItemName:String(r.MaterialName||r.ItemName||r.itemName||''),Warehouse:warehouse,UOM:uom,SourceQuantity:0,EffectiveQuantity:0,Rows:0});
    const item=grouped.get(key);
    item.SourceQuantity+=quantity;
    item.Rows++;
  }
  const items=[...grouped.values()];
  return {items,nonzero:items.filter(x=>x.SourceQuantity!==0),nonzeroCount:items.filter(x=>x.SourceQuantity!==0).length};
}

/** Admin-only read-only source for Extended Report 2 legacy-UOM section. */
function apiInventoryAdminExtendedLegacyUomWatchlist(input) {
  invRequireAdmin_();
  const snapshotId=String(input&&input.snapshotId||'').trim();
  if(!snapshotId)throw new Error('Snapshot ID required.');
  const snapshots=invRows_('WSSnapshots').filter(r=>String(r.SnapshotID)===snapshotId);
  if(snapshots.length!==1)throw new Error('Snapshot not found or duplicated.');
  const rows=invRows_('WSRows').filter(r=>String(r.SnapshotID)===snapshotId);
  // Default tokens are report-only; editable table remains a separate task.
  const watch=invExtendedLegacyUomWatchlist_(rows,['JYP','OTS','Dios','SCG']);
  return {snapshotId,sourceTimestamp:String(snapshots[0].SourceTimestamp||''),
    items:watch.items,nonzero:watch.nonzero,nonzeroCount:watch.nonzeroCount};
}

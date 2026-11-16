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
    const sourceQuantity=r.Units!==undefined?r.Units:r.Quantity;\n    const n=Number(sourceQuantity);
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
    // Preserve source quantity and source UOM in WSRows; normalize only during reconciliation.\n    // Commit rows first, then metadata and session pointer.
    const values=p.accepted.map(x=>[snapshotId,x.id,x.warehouse,x.uom,x.originalQuantity,
      x.itemName,x.classOfMaterial]);
    ws.getRange(ws.getLastRow()+1,1,values.length,7).setValues(values);
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

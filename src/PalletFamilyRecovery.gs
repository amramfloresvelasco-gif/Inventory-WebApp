/** Pure recovery classification for a multi-row pallet submission.
 * No Sheets writes. Caller must hold script lock while inspecting/recovering.
 */
function invClassifyPalletFamily_(expected,existing,scope) {
  if(!expected||!Array.isArray(expected.children)||!expected.children.length||
     !Array.isArray(existing))throw new Error('Expected family and existing rows required.');
  const parent=String(expected.parentSubmissionId||'');
  const ids=new Set(),issues=[],missing=[],matched=[];
  const equal=(row,child)=>
    String(row.EntryID)===child.entryId&&
    String(row.ParentEntryID)===parent&&
    String(row.UOM)===child.uom&&
    Number(row.Quantity)===child.quantity&&
    String(row.Status).toUpperCase()==='ACTIVE'&&
    Number(row.PalletMultiplier)===1&&
    (!scope||(String(row.SessionID)===scope.sessionId&&
      String(row.LocationID)===scope.locationId&&
      String(row.WSItemID)===scope.productId&&
      String(row.Team).toUpperCase()===scope.team&&
      String(row.EnteredBy).trim().toLowerCase()===scope.email&&
      String(row.EntryMethod)===scope.entryMethod&&
      String(row.Notes||'')===scope.notes));
  const family=existing.filter(r=>String(r.ParentEntryID)===parent||
    expected.children.some(c=>c.entryId===String(r.EntryID)));
  for(const row of family){
    const id=String(row.EntryID);
    if(ids.has(id))issues.push('Duplicate child ID '+id);
    ids.add(id);
    if(String(row.ParentEntryID)!==parent)issues.push('Parent mismatch '+id);
    if(!expected.children.some(c=>c.entryId===id))issues.push('Unexpected family child '+id);
  }
  for(const child of expected.children){
    const rows=family.filter(r=>String(r.EntryID)===child.entryId);
    if(!rows.length)missing.push(child);
    else if(rows.length!==1||!equal(rows[0],child))issues.push('Child mismatch '+child.entryId);
    else matched.push(child.entryId);
  }
  const state=issues.length?'BLOCKED':
    missing.length===expected.children.length?'EMPTY':
    missing.length?'PARTIAL':'COMPLETE';
  return {state,missing,matched,issues,canAppend:state==='EMPTY',
    note:state==='PARTIAL'?'Partial family requires verified recovery; do not append blindly.':
      state==='BLOCKED'?'Family mismatch requires administrator investigation.':
      state==='COMPLETE'?'All children present; idempotent retry.':'No existing family children.'};
}

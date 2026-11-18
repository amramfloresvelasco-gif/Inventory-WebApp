/** Administrator-only, read-only pallet family diagnostics.
 * Never repairs, deletes, or reveals family details to counters.
 */
function apiInventoryAdminPalletFamilyInspect(request) {
  invRequireAdmin_();
  const parent=String(request&&request.parentSubmissionId||'').trim();
  const sessionId=String(request&&request.sessionId||'').trim();
  if(!/^[A-Za-z0-9_-]{12,90}$/.test(parent)||!sessionId||sessionId.length>120)
    throw new Error('Valid parent submission ID and session required.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw new Error('Inventory busy; retry inspection.');
  try {
    invSession_(sessionId);
    const all=invRows_('CountEntries');
    const rows=all.filter(r=>String(r.ParentEntryID)===parent||
      String(r.EntryID)===parent||String(r.EntryID).startsWith(parent+'-'));
    if(rows.length>200)throw new Error('Family exceeds inspection limit.');
    if(!rows.length)return {found:false,parentSubmissionId:parent,sessionId,
      status:'NOT_FOUND',rowCount:0};
    const issues=[],ids=new Set(),suffixes=new Set();
    let cases=0,bottles=0,active=0;
    for(const r of rows){
      const id=String(r.EntryID),suffix=id.slice(parent.length+1);
      if(ids.has(id))issues.push('DUPLICATE_ENTRY_ID');
      ids.add(id);
      if(String(r.ParentEntryID)!==parent)issues.push('PARENT_MISMATCH');
      if(!new RegExp('^'+parent.replace(/[.*+?^$()|[\]{}\\]/g,'\\$&')+'-[A-Z]+$').test(id))
        issues.push('INVALID_CHILD_ID');
      if(suffixes.has(suffix))issues.push('DUPLICATE_SUFFIX');
      suffixes.add(suffix);
      if(String(r.SessionID)!==sessionId)issues.push('SESSION_MISMATCH');
      if(Number(r.PalletMultiplier)!==1)issues.push('MULTIPLIER_MISMATCH');
      const quantity=Number(r.Quantity),uom=String(r.UOM);
      if(!Number.isSafeInteger(quantity)||quantity<0)issues.push('INVALID_QUANTITY');
      if(!['Case','Bottle'].includes(uom))issues.push('INVALID_UOM');
      if(String(r.Status).toUpperCase()==='ACTIVE'){
        active++;
        if(uom==='Case'&&Number.isSafeInteger(quantity)&&quantity>=0)cases+=quantity;
        if(uom==='Bottle'&&Number.isSafeInteger(quantity)&&quantity>=0)bottles+=quantity;
      }else issues.push('INACTIVE_CHILD');
    }
    const first=rows[0];
    for(const r of rows){
      if(String(r.Team)!==String(first.Team))issues.push('TEAM_MISMATCH');
      if(String(r.LocationID)!==String(first.LocationID))issues.push('LOCATION_MISMATCH');
      if(String(r.WSItemID)!==String(first.WSItemID))issues.push('PRODUCT_MISMATCH');
      if(String(r.EnteredBy).toLowerCase()!==String(first.EnteredBy).toLowerCase())
        issues.push('OWNER_MISMATCH');
    }
    const uniqueIssues=[...new Set(issues)];
    return {found:true,parentSubmissionId:parent,sessionId,
      status:uniqueIssues.length?'REVIEW_REQUIRED':'STRUCTURALLY_VALID',
      // Structural validity alone cannot prove the originally intended child count.
      intentVerified:false,rowCount:rows.length,activeChildren:active,
      totalCases:cases,totalLooseBottles:bottles,issues:uniqueIssues,
      locationId:String(first.LocationID),productId:String(first.WSItemID),
      team:String(first.Team),enteredBy:String(first.EnteredBy)};
  }finally{lock.releaseLock();}
}

/** Administrator-only journal-aware inspection. Unlike structural-only
 * inspection, this verifies expected child count against the durable intent.
 * Read-only; never repairs or enables employee pallet submission.
 */
function apiInventoryAdminPalletJournalInspect(request) {
  invRequireAdmin_();
  const parent=String(request&&request.parentSubmissionId||'').trim();
  if(!/^[A-Za-z0-9_-]{12,90}$/.test(parent))
    throw new Error('Valid parent submission ID required.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw new Error('Inventory busy; retry inspection.');
  try {
    const journal=invPalletJournalRows_().filter(r=>
      String(r.ParentSubmissionID)===parent);
    if(journal.length!==1)return {status:'REVIEW_REQUIRED',
      reason:journal.length?'DUPLICATE_JOURNAL':'JOURNAL_NOT_FOUND',
      journalCount:journal.length,readOnly:true};
    const record=journal[0];
    let intent;
    try {intent=JSON.parse(String(record.IntentJSON||''));}
    catch(_) {return {status:'REVIEW_REQUIRED',reason:'INVALID_INTENT_JSON',readOnly:true};}
    if(!intent||intent.parentSubmissionId!==parent||
       String(record.SessionID)!==intent.sessionId||
       String(record.CreatedBy).trim().toLowerCase()!==intent.email||
       !['PREPARED','COMMITTED'].includes(String(record.Status).toUpperCase())||
       !Array.isArray(intent.children)||!intent.children.length)
      return {status:'REVIEW_REQUIRED',reason:'INVALID_JOURNAL_RECORD',readOnly:true};
    const full=intent.children.filter(x=>x.kind==='full-pallet');
    const partial=intent.children.filter(x=>x.kind==='partial-pallet');
    const loose=intent.children.filter(x=>x.kind==='loose-bottles');
    if(partial.length>1||loose.length>1||
       full.some(x=>x.quantity!==full[0].quantity))
      return {status:'REVIEW_REQUIRED',reason:'INVALID_CHILD_PLAN',readOnly:true};
    let canonical;
    try {
      canonical=invPalletIntent_({
        parentSubmissionId:parent,sessionId:intent.sessionId,
        locationId:intent.locationId,productId:intent.productId,
        entryMethod:intent.entryMethod,notes:intent.notes,
        pallets:full.length,casesPerPallet:full.length?full[0].quantity:0,
        partialCases:partial.length?partial[0].quantity:0,
        looseBottles:loose.length?loose[0].quantity:0
      },{email:intent.email,team:intent.team});
    }catch(_) {return {status:'REVIEW_REQUIRED',reason:'INVALID_CHILD_PLAN',readOnly:true};}
    if(!invPalletIntentEqual_(canonical,intent))
      return {status:'REVIEW_REQUIRED',reason:'NONCANONICAL_INTENT',readOnly:true};
    const entries=invRows_('CountEntries');
    const scope={sessionId:intent.sessionId,locationId:intent.locationId,
      productId:intent.productId,team:intent.team,email:intent.email,
      entryMethod:intent.entryMethod,notes:intent.notes};
    const outcome=invClassifyPalletFamily_(intent,entries,scope);
    return {status:outcome.state,readOnly:true,adminReviewRequired:outcome.state!=='COMPLETE',
      expectedChildren:intent.children.length,matchedChildren:outcome.matched.length,
      missingChildren:outcome.missing.length,issueCount:outcome.issues.length,
      missingKinds:outcome.missing.map(c=>c.kind),journalStatus:String(record.Status)};
  }finally {lock.releaseLock();}
}

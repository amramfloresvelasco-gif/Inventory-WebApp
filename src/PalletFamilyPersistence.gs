/** Private pallet family persistence. Not exposed as an RPC until production approval.
 * Holds a script lock for validation, idempotency classification and a single
 * rectangular Sheets write. Partial families fail closed for manual recovery.
 */
function invSavePalletFamilyPrivate_(request) {
  if(!request||typeof request!=='object')throw new Error('Missing pallet submission.');
  const user=invUser_(),team=invTeam_(user);
  const sessionId=String(request.sessionId||'').trim();
  const locationId=String(request.locationId||'').trim();
  const productId=String(request.productId||'').trim();
  const entryMethod=String(request.entryMethod||'Manual');
  const notes=String(request.notes||'');
  if(!sessionId||!locationId||!productId)throw new Error('Session, location and product required.');
  if(!['Manual','Barcode','QR'].includes(entryMethod))throw new Error('Invalid entry method.');
  if(notes.length>500)throw new Error('Notes exceed 500 characters.');
  const family=invPlanPalletChildren_({
    parentSubmissionId:request.parentSubmissionId,
    pallets:request.pallets,casesPerPallet:request.casesPerPallet,
    partialCases:request.partialCases,looseBottles:request.looseBottles
  });
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw new Error('Inventory busy; retry with same parent ID.');
  try {
    invSession_(sessionId);
    const ref=invReference_();
    if(ref.locations.filter(x=>String(x.LocationID)===locationId).length!==1)
      throw new Error('Invalid or duplicated active location.');
    const products=ref.products.filter(x=>String(x.WSItemID)===productId);
    if(products.length!==1)throw new Error('Invalid or duplicated active product.');
    const product=products[0];
    if(String(product.ClassOfMaterial).trim().toLowerCase()!=='finished good')
      throw new Error('Pallet family is only available for finished goods.');
    const pack=Number(product.UnitsPerCase);
    if(product.UnitsPerCase===''||product.UnitsPerCase===null||
       !Number.isSafeInteger(pack)||pack<=0)
      throw new Error('Missing or invalid units per case.');
    const existing=invRows_('CountEntries');
    const scope={sessionId,locationId,productId,team,email:user.email,entryMethod,notes};
    // Journal intent must be durable before any physical child record is written.
    // An unjournaled existing family is an orphan and must never be acknowledged.
    const intent=invPalletIntent_(request,{email:user.email,team});
    const journalDecision=invPalletJournalDecision_(intent,invPalletJournalRows_());
    if(journalDecision.action==='BLOCK')
      throw new Error('Pallet journal '+journalDecision.reason+'; administrator review required.');
    const state=invClassifyPalletFamily_(family,existing,scope);
    if(journalDecision.action==='WRITE_INTENT'&&state.state!=='EMPTY')
      throw new Error('Orphan pallet children without original intent; administrator review required.');
    if(state.state==='COMPLETE')
      return {ok:true,duplicate:true,parentSubmissionId:family.parentSubmissionId,
        childCount:family.childCount,totalCases:family.totalCases,
        totalLooseBottles:family.totalLooseBottles};
    if(state.state!=='EMPTY')throw new Error('Pallet family '+state.state+
      '; do not resubmit with a different ID. Contact administrator.');
    if(existing.some(x=>String(x.EntryID)===family.parentSubmissionId))
      throw new Error('Parent ID already used as a physical count.');
    if(existing.some(x=>String(x.SessionID)===sessionId&&
      String(x.LocationID)===locationId&&String(x.Team).toUpperCase()===team&&
      String(x.Status).toUpperCase()==='ACTIVE'&&
      String(x.EntryMethod).toUpperCase()==='EMPTY'))
      throw new Error('Remove your team EMPTY entry before counting items.');
    invPalletJournalPrepare_(intent);
    const prepared=invPalletJournalStatus_(intent,existing,scope);
    if(prepared.status!=='PREPARED')
      throw new Error('Pallet journal is not ready for child writes: '+prepared.status);
    const sheet=invSheet_('CountEntries'),start=sheet.getLastRow()+1;
    const timestamp=new Date();
    const rows=family.children.map(child=>[
      child.entryId,sessionId,team,locationId,productId,child.uom,
      child.quantity,family.parentSubmissionId,1,user.email,timestamp,
      entryMethod,notes,'ACTIVE'
    ]);
    sheet.getRange(start,1,rows.length,14).setValues(rows);
    // A Sheets write acknowledgement is not proof that every child persisted.
    // Verify the complete family while still holding the same script lock.
    const verified=invClassifyPalletFamily_(family,invRows_('CountEntries'),scope);
    if(verified.state!=='COMPLETE')
      throw new Error('Pallet family write could not be verified ('+verified.state+
        '). Do not retry with a different parent ID; contact administrator.');
    const finalJournal=invPalletJournalStatus_(intent,invRows_('CountEntries'),scope);
    if(finalJournal.status!=='COMPLETE')
      throw new Error('Pallet journal final verification failed: '+finalJournal.status);
    return {ok:true,duplicate:false,parentSubmissionId:family.parentSubmissionId,
      childCount:family.childCount,totalCases:family.totalCases,
      totalLooseBottles:family.totalLooseBottles};
  }finally{lock.releaseLock();}
}

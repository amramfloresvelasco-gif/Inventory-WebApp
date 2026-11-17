/** Pure write-ahead pallet intent journal state machine.
 * Journal storage is deliberately not provisioned or enabled here.
 * Storage must enforce unique ParentSubmissionID and immutable IntentJSON.
 */
function invPalletJournalDecision_(intent,records) {
  if(!intent||typeof intent!=='object'||!Array.isArray(records))
    throw new Error('Canonical intent and journal records required.');
  const parent=String(intent.parentSubmissionId||'');
  if(!parent)throw new Error('Missing parent submission ID.');
  const matches=records.filter(r=>String(r.ParentSubmissionID)===parent);
  if(matches.length>1)return {action:'BLOCK',reason:'DUPLICATE_JOURNAL'};
  if(!matches.length)return {action:'WRITE_INTENT',reason:'FIRST_SUBMISSION'};
  const record=matches[0];
  let stored;
  try { stored=JSON.parse(String(record.IntentJSON||'')); }
  catch(_) {return {action:'BLOCK',reason:'INVALID_STORED_INTENT'};}
  if(!invPalletIntentEqual_(stored,intent))
    return {action:'BLOCK',reason:'INTENT_CHANGED'};
  const status=String(record.Status||'').toUpperCase();
  if(status==='PREPARED')return {action:'INSPECT_CHILDREN',reason:'PREPARED_RETRY'};
  if(status==='COMMITTED')return {action:'INSPECT_CHILDREN',reason:'COMMITTED_RETRY'};
  return {action:'BLOCK',reason:'UNKNOWN_JOURNAL_STATUS'};
}
/** Decide from original journal intent and observed physical children.
 * A PARTIAL family is never silently completed by a retry.
 */
function invPalletJournalReconcile_(intent,existing,scope) {
  const expected={parentSubmissionId:intent.parentSubmissionId,
    children:intent.children.map(c=>({entryId:c.entryId,uom:c.uom,quantity:c.quantity}))};
  const result=invClassifyPalletFamily_(expected,existing,scope);
  if(result.state==='COMPLETE')return {action:'ACKNOWLEDGE',state:'COMPLETE'};
  if(result.state==='EMPTY')return {action:'WRITE_CHILDREN',state:'EMPTY'};
  return {action:'BLOCK',state:result.state,reason:'ADMIN_REVIEW_REQUIRED'};
}

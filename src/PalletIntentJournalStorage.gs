/** Pallet submission journal schema and storage adapter.
 * This file does NOT create a database tab or enable pallet saving.
 * All calls must run under the caller's inventory script lock.
 * Journal rows are append-only: a PREPARED intent is never overwritten.
 */
const INV_PALLET_JOURNAL_HEADERS = [
  'ParentSubmissionID','SessionID','IntentJSON','Status','CreatedAt','CreatedBy'
];
function invPalletJournalRows_() {
  const sheet=invSheet_('PalletSubmissionJournal');
  const actual=sheet.getRange(1,1,1,INV_PALLET_JOURNAL_HEADERS.length)
    .getDisplayValues()[0];
  if(actual.join('|')!==INV_PALLET_JOURNAL_HEADERS.join('|'))
    throw new Error('Unexpected PalletSubmissionJournal schema.');
  const last=sheet.getLastRow();
  if(last<2)return [];
  return sheet.getRange(2,1,last-1,INV_PALLET_JOURNAL_HEADERS.length)
    .getValues().map((values,i)=>Object.fromEntries(
      INV_PALLET_JOURNAL_HEADERS.map((name,j)=>[name,values[j]])));
}
/** Append canonical intent only after caller has validated session, product,
 * location and identity, and while holding the script lock.
 */
function invPalletJournalPrepare_(intent) {
  const rows=invPalletJournalRows_();
  const decision=invPalletJournalDecision_(intent,rows);
  if(decision.action==='BLOCK')
    throw new Error('Pallet journal '+decision.reason+'; administrator review required.');
  if(decision.action==='INSPECT_CHILDREN')
    return {prepared:false,retry:true,decision};
  const sheet=invSheet_('PalletSubmissionJournal');
  const payload=[
    intent.parentSubmissionId,intent.sessionId,JSON.stringify(intent),
    'PREPARED',new Date(),intent.email
  ];
  sheet.getRange(sheet.getLastRow()+1,1,1,payload.length).setValues([payload]);
  // Verify durable intent before any child write.
  const verified=invPalletJournalDecision_(intent,invPalletJournalRows_());
  if(verified.action!=='INSPECT_CHILDREN'||verified.reason!=='PREPARED_RETRY')
    throw new Error('Pallet journal prepare not verified; no child writes allowed.');
  return {prepared:true,retry:false,decision:verified};
}
/** The journal intentionally stays PREPARED after child write.
 * COMPLETE is derived by comparing all children to immutable intent.
 * This avoids an in-place COMMITTED mutation that could be lost.
 */
function invPalletJournalStatus_(intent,entries,scope) {
  const decision=invPalletJournalDecision_(intent,invPalletJournalRows_());
  if(decision.action!=='INSPECT_CHILDREN')
    return {status:'BLOCKED',reason:decision.reason};
  const outcome=invPalletJournalReconcile_(intent,entries,scope);
  return {status:outcome.action==='ACKNOWLEDGE'?'COMPLETE':
    outcome.action==='WRITE_CHILDREN'?'PREPARED':'REVIEW_REQUIRED',
    reason:outcome.reason||outcome.state};
}

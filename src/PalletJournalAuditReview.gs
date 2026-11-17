/** Strict recognition of the one approved Stage 41 audit-only row.
 * Never use this function to discard rows from production journal reconciliation.
 */
function invPalletJournalAuditRowDecision_(row) {
  const marker='TEST_ONLY_JOURNAL_20261116_STAGE41';
  if(!row||String(row.ParentSubmissionID)!==marker)
    return {state:'NOT_STAGE41_AUDIT'};
  let intent;
  try {intent=JSON.parse(String(row.IntentJSON||''));}
  catch(_) {return {state:'AUDIT_ROW_TAMPERED'};}
  const expectedPurpose='Journal storage read/write verification only; no pallet submission; no count children';
  const keys=Object.keys(intent).sort().join('|');
  const valid=String(row.SessionID)==='TEST_ONLY_NO_SESSION'&&
    String(row.Status)==='TEST_ONLY'&&
    String(row.CreatedBy)==='SYSTEM_TEST_NO_USER'&&
    keys==='marker|purpose|testOnly'&&intent.testOnly===true&&
    intent.marker===marker&&intent.purpose===expectedPurpose;
  return {state:valid?'STAGE41_AUDIT_ONLY':'AUDIT_ROW_TAMPERED'};
}
function invPalletJournalAuditReview_(rows) {
  if(!Array.isArray(rows))throw new Error('Journal rows required.');
  const audit=rows.map(invPalletJournalAuditRowDecision_);
  const recognized=audit.filter(x=>x.state==='STAGE41_AUDIT_ONLY').length;
  const tampered=audit.filter(x=>x.state==='AUDIT_ROW_TAMPERED').length;
  return {state:tampered||recognized>1?'ADMIN_REVIEW_REQUIRED':'AUDIT_INSPECTED',
    stage41AuditRows:recognized,tamperedAuditRows:tampered,
    otherJournalRows:rows.length-recognized-tampered,canEnable:false};
}

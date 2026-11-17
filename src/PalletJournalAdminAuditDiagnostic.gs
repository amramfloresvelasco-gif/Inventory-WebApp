/** Administrator-only, read-only audit diagnostic.
 * A recognized test row is informational; never authorizes pallet saving.
 */
function apiInventoryPalletJournalAuditReview() {
  invRequireAdmin_();
  const preflight=apiInventoryPalletJournalPreflight();
  if(preflight.state==='MISSING'||preflight.state==='SCHEMA_MISMATCH'||
     preflight.state==='UNKNOWN_CONTENTS')
    return {state:'PREFLIGHT_BLOCKED',preflightState:preflight.state,canEnable:false};
  const rows=invPalletJournalRows_();
  const review=invPalletJournalAuditReview_(rows);
  return {state:review.state,preflightState:preflight.state,
    stage41AuditRows:review.stage41AuditRows,
    tamperedAuditRows:review.tamperedAuditRows,
    otherJournalRows:review.otherJournalRows,canEnable:false};
}

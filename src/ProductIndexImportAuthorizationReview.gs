/**
 * Future ProductIndex import authorization checklist, pure and fail-closed.
 * This does NOT grant approval, issue a token, persist consent, or write data.
 * Actual authorization requires a separately reviewed implementation.
 */
function invProductIndexImportAuthorizationReview_(input) {
  const issues=[];
  if(!input||typeof input!=='object')
    return {readyForHumanReview:false,importEnabled:false,
      issues:['Complete authorization review input required']};
  if(input.adminVerified!==true||!String(input.actor||'').trim())
    issues.push('Verified administrator identity required');
  if(input.preflightReady!==true||input.existingRows!==0||
      !Number.isSafeInteger(input.stagedRows)||input.stagedRows<1)
    issues.push('Fresh successful preflight with empty target required');
  if(input.sourceFingerprintVerified!==true)
    issues.push('Source snapshot fingerprint verification required');
  if(input.evidenceBackupVerified!==true||input.auditChainVerified!==true)
    issues.push('Durable backup and audit evidence verification required');
  if(input.permissionInspectionComplete!==true||
      input.permissionPolicyReady!==true||
      input.inheritedAccessReviewed!==true)
    issues.push('Complete evidence folder access review required');
  if(input.lockHeld!==true)
    issues.push('Exclusive import lock required');
  if(input.operatorAcknowledgedRisks!==true)
    issues.push('Operator must acknowledge import and recovery risks');
  if(input.explicitApprovalRecorded!==true)
    issues.push('Separate explicit administrator approval required');
  return {readyForHumanReview:issues.length===0,
    importEnabled:false,issues,
    note:'Checklist only; approval and import execution are not implemented.'};
}

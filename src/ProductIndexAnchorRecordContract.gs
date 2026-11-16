/**
 * Pure contract for a future independently anchored preflight record.
 * Caller-supplied records are NOT authenticated by this function.
 * No storage, signatures, approvals, or ProductIndex writes.
 */
function invProductIndexValidateAnchorRecord_(record,nowMs) {
  const issues=[];
  if(!record||typeof record!=='object')
    return {valid:false,issues:['Preflight anchor record required']};
  if(record.format!=='product-index-anchor-v1')
    issues.push('Unsupported preflight anchor format');
  if(!String(record.anchorId||'').trim()||!String(record.actor||'').trim())
    issues.push('Anchor identity and operator required');
  if(!Number.isSafeInteger(record.createdAtMs)||
      !Number.isSafeInteger(record.expiresAtMs)||
      record.expiresAtMs<=record.createdAtMs)
    issues.push('Valid anchor time window required');
  if(!Number.isSafeInteger(nowMs)||nowMs<record.createdAtMs||
      nowMs>=record.expiresAtMs)
    issues.push('Anchor expired or not yet valid');
  if(!invProductIndexValidateSourceFingerprint_(record.sourceFingerprints))
    issues.push('Complete source fingerprints required');
  const stage=record.stageFingerprint;
  if(!stage||stage.format!=='product-index-stage-v1'||
      !Number.isSafeInteger(stage.count)||stage.count<1||
      typeof stage.sha256!=='string'||!/^[a-f0-9]{64}$/.test(stage.sha256))
    issues.push('Valid staged fingerprint required');
  if(record.targetEmptyVerified!==true)
    issues.push('Empty ProductIndex target verification required');
  if(record.independentVerification!==true)
    issues.push('Independent verification evidence required');
  return {valid:issues.length===0,issues,importEnabled:false,
    note:'Structural review only; independentVerification is not authenticated here.'};
}

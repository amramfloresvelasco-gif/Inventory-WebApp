/**
 * Admin-only, read-only verification against operator-retained fingerprints.
 * Fingerprints supplied by the caller are comparison inputs, NOT proof of
 * independent trust, approval, or authority to import.
 */
function apiInventoryAdminProductIndexVerifyPreflight(trusted) {
  const admin=invRequireAdmin_();
  if(!trusted||typeof trusted!=='object'||
      !invProductIndexValidateSourceFingerprint_(trusted.sourceFingerprints)||
      !trusted.stageFingerprint||
      trusted.stageFingerprint.format!=='product-index-stage-v1'||
      !Number.isSafeInteger(trusted.stageFingerprint.count)||
      trusted.stageFingerprint.count<1||
      !/^[a-f0-9]{64}$/.test(String(trusted.stageFingerprint.sha256||'')))
    return {readOnly:true,matches:false,importEnabled:false,
      issues:['Complete prior preflight fingerprints required']};
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))
    throw new Error('ProductIndex verification busy; retry.');
  try {
    const started=Date.now();
    const fresh=invProductIndexFreshPlan_(function(){});
    const stage=invStageInitialProductIndex_(fresh.preview,fresh.existing,
      'IMPORT_INITIAL_PRODUCT_INDEX');
    const comparison=invProductIndexCompareTrustedPreflight_(fresh,stage,trusted);
    return {readOnly:true,matches:comparison.matches,importEnabled:false,
      operator:admin.email,existingRows:fresh.existing.length,
      stagedRows:stage.ready?stage.count:0,
      issues:[...fresh.issues,...stage.issues,...comparison.issues].slice(0,50),
      elapsedMs:Date.now()-started,
      note:'Read-only comparison only. Caller-provided hashes do not grant approval.'};
  }finally{lock.releaseLock();}
}

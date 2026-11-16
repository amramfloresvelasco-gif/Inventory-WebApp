/**
 * Admin-only, lock-protected dry run for a future initial ProductIndex import.
 * Explicitly no SpreadsheetApp writes, no import endpoint, no approval persistence.
 * Re-reads all sources and ProductIndex while holding the script lock.
 */
function apiInventoryAdminProductIndexImportPreflight() {
  const admin=invRequireAdmin_();
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw new Error('ProductIndex preflight busy; retry.');
  try {
    const started=Date.now(),phases=[];
    let previous=started;
    function markPhase(name){const now=Date.now();phases.push({name,elapsedMs:now-previous});previous=now;}
    const fresh=invProductIndexFreshPlan_(markPhase);
    // Internal token tests staging gates; not an authorization to write.
    const stage=invStageInitialProductIndex_(fresh.preview,fresh.existing,
      'IMPORT_INITIAL_PRODUCT_INDEX');
    const issues=[...fresh.issues,...stage.issues];
    const ready=fresh.ready&&stage.ready&&issues.length===0;
    return {readOnly:true,ready,importEnabled:false,operator:admin.email,
      counts:fresh.preview.counts,existingRows:fresh.existing.length,
      stagedRows:ready?stage.count:0,issueCount:issues.length,
      issues:issues.slice(0,50),phases,elapsedMs:Date.now()-started,
      note:'Dry run only. No approval accepted, no import or database writes.'};
  }finally{lock.releaseLock();}
}

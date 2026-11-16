/**
 * Pure recovery assessment for the initial ProductIndex import.
 * No writes, deletions, rollback execution or public RPCs.
 * Recovery requires an operator-reviewed durable backup and audit journal.
 */
function invAssessInitialProductIndexRecovery_(stage, currentHeaders, currentRows, journal) {
  const issues=[];
  if(!stage||stage.ready!==true||!Array.isArray(stage.headers)||!Array.isArray(stage.rows))
    return {state:'BLOCKED',safeToRetry:false,requiresManualReview:true,
      issues:['Missing validated staging plan']};
  if(!Array.isArray(currentHeaders)||currentHeaders.length!==stage.headers.length||
      currentHeaders.some((h,i)=>h!==stage.headers[i]))
    issues.push('ProductIndex schema differs from staging plan');
  if(!Array.isArray(currentRows))issues.push('ProductIndex readback unavailable');
  if(issues.length)return {state:'BLOCKED',safeToRetry:false,requiresManualReview:true,issues};
  if(currentRows.length===0)
    return {state:'EMPTY',safeToRetry:true,requiresManualReview:false,issues:[]};
  const verified=invVerifyStagedProductIndex_(stage,currentHeaders,currentRows);
  if(verified.ok)
    return {state:'MATCHES_STAGE',safeToRetry:false,requiresManualReview:false,
      issues:[],count:verified.count};
  const expectedById=new Map(stage.rows.map(row=>[String(row[0]),row]));
  const seen=new Set(),foreign=[],altered=[],duplicate=[];
  for(const row of currentRows){
    const id=Array.isArray(row)?String(row[0]??''):'';
    if(!id||seen.has(id)){duplicate.push(id);continue;}
    seen.add(id);
    const expected=expectedById.get(id);
    if(!expected){foreign.push(id);continue;}
    if(!Array.isArray(row)||row.length!==expected.length||
        row.some((v,j)=>String(v??'')!==String(expected[j]??'')))altered.push(id);
  }
  const missing=stage.rows.filter(row=>!seen.has(String(row[0]))).length;
  // Never silently clear or retry a nonempty target. Journal alone is not
  // proof of ownership; it must be verified against a durable backup.
  const journalPresent=!!(journal&&journal.importId&&journal.backupId);
  return {state:'REQUIRES_RECOVERY',safeToRetry:false,requiresManualReview:true,
    issues:['Target differs from complete staged import'],
    present:currentRows.length,missing,foreign,altered,duplicate,
    journalPresent,rollbackAuthorized:false};
}

/** Pure audit event factory. Caller must persist events durably before any writes. */
function invInitialProductIndexAuditEvent_(importId,phase,actor,detail) {
  const allowed=['PREPARED','BACKUP_VERIFIED','WRITE_STARTED','WRITE_VERIFIED',
    'FAILED','RECOVERY_REQUIRED','RECOVERED'];
  if(!importId||!actor||!allowed.includes(phase))
    throw new Error('Invalid ProductIndex import audit event');
  return {importId:String(importId),phase,actor:String(actor),
    detail:detail&&typeof detail==='object'?JSON.stringify(detail):String(detail||'')};
}

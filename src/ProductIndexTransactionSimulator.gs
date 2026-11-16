/**
 * Dependency-injected INITIAL ProductIndex transaction simulator.
 * Not an Apps Script RPC. No SpreadsheetApp references or production adapter.
 * The adapter is supplied only by tests; no live database can be changed here.
 *
 * Contract: snapshot() -> {headers,rows}; persistBackup(snapshot) -> backupId;
 * appendAudit(event); writeRows(rows); readback() -> {headers,rows}.
 * Recovery is intentionally NOT automatic: a failed write must be inspected.
 */
function invSimulateInitialProductIndexTransaction_(stage, actor, adapter, importId) {
  if(!stage||!stage.ready||!actor||!importId)throw new Error('Invalid transaction inputs');
  for(const method of ['snapshot','persistBackup','appendAudit','writeRows','readback'])
    if(!adapter||typeof adapter[method]!=='function')
      throw new Error('Missing transaction adapter method: '+method);
  const audit=(phase,detail)=>adapter.appendAudit(
    invInitialProductIndexAuditEvent_(importId,phase,actor,detail));
  // The mock adapter must expose a consistent empty target and preserve its backup.
  const before=adapter.snapshot();
  if(!before||!Array.isArray(before.rows)||before.rows.length!==0||
      !Array.isArray(before.headers)||before.headers.some((h,i)=>h!==stage.headers[i])||
      before.headers.length!==stage.headers.length)
    throw new Error('Initial import requires an empty target with matching headers');
  const backupId=adapter.persistBackup(before);
  if(!backupId)throw new Error('Durable backup confirmation required');
  audit('PREPARED',{count:stage.count,backupId});
  audit('BACKUP_VERIFIED',{backupId});
  // A second check protects against intervening mock mutations.
  const latest=adapter.snapshot();
  if(!latest||!Array.isArray(latest.rows)||latest.rows.length!==0||
      JSON.stringify(latest.headers)!==JSON.stringify(stage.headers))
    throw new Error('Target changed after backup; abort');
  let writeStarted=false;
  try {
    audit('WRITE_STARTED',{count:stage.count});
    writeStarted=true;
    adapter.writeRows(stage.rows.map(r=>r.slice()));
    const actual=adapter.readback();
    const verified=invVerifyStagedProductIndex_(stage,actual&&actual.headers,actual&&actual.rows);
    if(!verified.ok)throw new Error(verified.reason);
    audit('WRITE_VERIFIED',{count:verified.count});
    return {ok:true,importId,backupId,count:verified.count};
  }catch(error){
    // Never erase partial rows. A missing failure journal is still an error.
    const failures=[];
    if(writeStarted)for(const phase of ['FAILED','RECOVERY_REQUIRED']){
      try{audit(phase,{message:String(error.message||error),backupId});}
      catch(auditError){failures.push(String(auditError.message||auditError));}
    }
    return {ok:false,importId,backupId,recoveryRequired:writeStarted,
      error:String(error.message||error),auditFailures:failures};
  }
}

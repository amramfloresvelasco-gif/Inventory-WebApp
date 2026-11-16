/**
 * Durable evidence contract for a future ProductIndex initial import.
 * Pure validation only: no SpreadsheetApp/DriveApp writes or public RPC.
 * The eventual adapter must persist a separate immutable backup and journal,
 * then read them back before any ProductIndex write is permitted.
 */
function invValidateProductIndexEvidence_(stage,backup,journal,importId,actor) {
  const issues=[];
  if(!stage||stage.ready!==true||!Array.isArray(stage.headers)||!Array.isArray(stage.rows))
    issues.push('Valid staged ProductIndex required');
  if(!backup||!backup.backupId||backup.importId!==importId||
      backup.actor!==actor||backup.immutable!==true)
    issues.push('Missing immutable backup identity and ownership');
  if(!backup||!Array.isArray(backup.headers)||!Array.isArray(backup.rows)||
      backup.rows.length!==0||!stage||
      JSON.stringify(backup.headers)!==JSON.stringify(stage.headers))
    issues.push('Backup must preserve exact headers and empty initial target');
  if(!journal||!Array.isArray(journal.events)||
      journal.importId!==importId||journal.actor!==actor||
      journal.durable!==true)
    issues.push('Missing durable journal identity and ownership');
  const phases=journal&&Array.isArray(journal.events)?
    journal.events.map(e=>e&&e.phase):[];
  if(phases.length!==2||phases[0]!=='PREPARED'||phases[1]!=='BACKUP_VERIFIED')
    issues.push('Required pre-write audit events missing or out of order');
  if(journal&&Array.isArray(journal.events)&&journal.events.some(e=>
    !e||e.importId!==importId||e.actor!==actor))
    issues.push('Audit event identity mismatch');
  if(!backup||!journal||backup.backupId!==journal.backupId)
    issues.push('Backup and journal references differ');
  return {ready:issues.length===0,issues};
}

/** A separate readback of durable evidence is mandatory before writing. */
function invVerifyProductIndexEvidenceReadback_(stage,expected,readback,importId,actor) {
  const first=invValidateProductIndexEvidence_(stage,expected.backup,
    expected.journal,importId,actor);
  if(!first.ready)return first;
  const second=invValidateProductIndexEvidence_(stage,readback&&readback.backup,
    readback&&readback.journal,importId,actor);
  if(!second.ready)return second;
  if(JSON.stringify(expected)!==JSON.stringify(readback))
    return {ready:false,issues:['Durable evidence readback differs from persisted snapshot']};
  return {ready:true,issues:[]};
}

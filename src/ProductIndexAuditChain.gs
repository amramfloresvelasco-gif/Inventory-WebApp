/**
 * Append-only audit event-chain validation for a future initial import.
 * Pure functions. Each event is stored as a separate write-once file by
 * the eventual adapter; no live ProductIndex writes or public RPC.
 */
function invProductIndexAuditNextPhase_(events,next) {
  const transitions={
    '':['PREPARED'],
    PREPARED:['BACKUP_VERIFIED','FAILED'],
    BACKUP_VERIFIED:['WRITE_STARTED','FAILED'],
    WRITE_STARTED:['WRITE_VERIFIED','FAILED','RECOVERY_REQUIRED'],
    WRITE_VERIFIED:[],
    FAILED:['RECOVERY_REQUIRED'],
    RECOVERY_REQUIRED:['RECOVERED'],
    RECOVERED:[]
  };
  const last=events.length?events[events.length-1].phase:'';
  return (transitions[last]||[]).includes(next);
}
function invValidateProductIndexAuditChain_(events,importId,actor) {
  const issues=[];
  if(!Array.isArray(events)||events.length===0)
    return {valid:false,issues:['Audit event chain is empty']};
  const prior=[];
  for(let i=0;i<events.length;i++){
    const e=events[i];
    if(!e||e.importId!==importId||e.actor!==actor)
      issues.push('Audit identity mismatch at '+i);
    if(!e||!invProductIndexAuditNextPhase_(prior,e.phase))
      issues.push('Invalid audit phase transition at '+i);
    if(e&&(!Number.isSafeInteger(e.sequence)||e.sequence!==i+1))
      issues.push('Invalid audit sequence at '+i);
    if(e&&e.previousEventId!==(i?events[i-1].eventId:null))
      issues.push('Audit predecessor mismatch at '+i);
    if(e&&(!e.eventId||typeof e.eventId!=='string'))
      issues.push('Missing audit event ID at '+i);
    if(e&&prior.some(p=>p.eventId===e.eventId))
      issues.push('Duplicate audit event ID at '+i);
    prior.push(e||{phase:'INVALID'});
  }
  return {valid:issues.length===0,issues,lastPhase:prior[prior.length-1].phase};
}
/** Constructs an event with an explicit predecessor; caller must persist/readback. */
function invProductIndexNextAuditEvent_(events,importId,actor,eventId,phase,detail) {
  if(!Array.isArray(events)||!invProductIndexAuditNextPhase_(events,phase))
    throw new Error('Invalid audit phase transition');
  if(events.length&&!invValidateProductIndexAuditChain_(events,importId,actor).valid)
    throw new Error('Existing audit chain invalid');
  if(!eventId||events.some(e=>e.eventId===eventId))
    throw new Error('Duplicate or missing audit event ID');
  const base=invInitialProductIndexAuditEvent_(importId,phase,actor,detail);
  return {...base,eventId,sequence:events.length+1,
    previousEventId:events.length?events[events.length-1].eventId:null};
}

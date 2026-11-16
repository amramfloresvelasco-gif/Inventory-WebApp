/**
 * Private per-event Drive audit storage. Not called by any production RPC.
 * Must be invoked under the caller's script lock. Drive is not WORM storage.
 */
function invProductIndexAuditEventFileName_(importId,sequence) {
  invProductIndexEvidenceFileName_(importId,'journal'); // validate import ID
  if(!Number.isSafeInteger(sequence)||sequence<1||sequence>100)
    throw new Error('Invalid audit event sequence');
  return 'product-index-'+importId+'-event-'+String(sequence).padStart(3,'0')+'.json';
}
function invProductIndexAuditFiles_(folder,importId) {
  invProductIndexEvidenceFileName_(importId,'journal');
  const prefix='product-index-'+importId+'-event-';
  const files=folder.getFiles();
  const indexed=[];
  while(files.hasNext()){
    const file=files.next(),name=file.getName();
    if(name.startsWith(prefix))indexed.push({file,name});
  }
  indexed.sort((a,b)=>a.name.localeCompare(b.name));
  return indexed;
}
/**
 * Read ALL event files, enforce contiguous file names and valid event chain.
 * Refuse duplicates and unexpected names. Never ignore an invalid file.
 */
function invProductIndexReadAuditEventsDisabled_(folder,importId,actor) {
  const indexed=invProductIndexAuditFiles_(folder,importId);
  const events=[];
  for(let i=0;i<indexed.length;i++){
    const expected=invProductIndexAuditEventFileName_(importId,i+1);
    if(indexed[i].name!==expected)
      throw new Error('Missing, duplicate or unexpected audit event file');
    const event=invProductIndexEvidenceReadById_(folder,indexed[i].file.getId(),expected);
    events.push(event);
  }
  if(events.length){
    const result=invValidateProductIndexAuditChain_(events,importId,actor);
    if(!result.valid)throw new Error('Invalid persisted audit chain: '+result.issues.join('; '));
  }
  return events;
}
/** Write exactly one event and verify a fresh complete-chain readback. */
function invProductIndexAppendAuditEventDisabled_(folder,importId,actor,eventId,phase,detail) {
  const previous=invProductIndexReadAuditEventsDisabled_(folder,importId,actor);
  const next=invProductIndexNextAuditEvent_(previous,importId,actor,eventId,phase,detail);
  const filename=invProductIndexAuditEventFileName_(importId,next.sequence);
  const saved=invProductIndexEvidenceWriteOnce_(folder,filename,next);
  const readback=invProductIndexReadAuditEventsDisabled_(folder,importId,actor);
  if(readback.length!==previous.length+1||
      JSON.stringify(readback[readback.length-1])!==JSON.stringify(next))
    throw new Error('Persisted audit chain readback mismatch');
  return {fileId:saved.fileId,event:next,count:readback.length};
}

/**
 * Compare a newly refreshed ProductIndex plan with independently retained
 * fingerprints. Pure, fail-closed, no approval token and no database writes.
 * Caller must obtain the trusted fingerprints from outside this invocation.
 */
function invProductIndexCompareTrustedPreflight_(fresh,stage,trusted) {
  const issues=[];
  if(!fresh||fresh.ready!==true||!stage||stage.ready!==true)
    issues.push('Fresh validated source plan and stage required');
  if(!trusted||!trusted.sourceFingerprints||!trusted.stageFingerprint)
    issues.push('Independently retained preflight fingerprints required');
  if(!issues.length){
    try {
      const source=invProductIndexSourceFingerprints_(fresh.sourceSnapshots);
      if(JSON.stringify(source)!==JSON.stringify(trusted.sourceFingerprints))
        issues.push('Source data changed since trusted preflight');
    }catch(error){issues.push('Cannot verify fresh sources: '+String(error.message||error));}
    const staged=invProductIndexVerifyStageFingerprint_(stage,trusted.stageFingerprint);
    if(!staged.ok)issues.push(staged.reason);
  }
  return {matches:issues.length===0,importEnabled:false,issues};
}

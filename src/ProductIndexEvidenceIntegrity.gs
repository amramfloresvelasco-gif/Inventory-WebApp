/**
 * SHA-256 integrity helpers for future ProductIndex evidence files.
 * Detects accidental or unauthorized content changes against an independently
 * retained digest. Hashes alone do NOT prevent a privileged actor from
 * replacing both content and digest.
 */
function invProductIndexSha256_(value) {
  const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
    String(value),Utilities.Charset.UTF_8);
  return bytes.map(b=>('0'+(b<0?b+256:b).toString(16)).slice(-2)).join('');
}
function invProductIndexEvidenceEnvelope_(payload) {
  const serialized=JSON.stringify(payload);
  return {format:'product-index-evidence-v1',sha256:invProductIndexSha256_(serialized),
    payload};
}
function invProductIndexVerifyEvidenceEnvelope_(envelope) {
  if(!envelope||envelope.format!=='product-index-evidence-v1'||
      !/^[a-f0-9]{64}$/.test(String(envelope.sha256||''))||
      !Object.prototype.hasOwnProperty.call(envelope,'payload'))
    throw new Error('Invalid ProductIndex evidence envelope');
  if(invProductIndexSha256_(JSON.stringify(envelope.payload))!==envelope.sha256)
    throw new Error('ProductIndex evidence digest mismatch');
  return envelope.payload;
}

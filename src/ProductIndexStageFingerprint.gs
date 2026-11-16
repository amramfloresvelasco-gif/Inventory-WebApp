/**
 * Deterministic ProductIndex staged-plan fingerprint, pure except SHA-256
 * helper. Covers headers, ordered cell values and count; no write or RPC.
 * Fingerprinting staged output does NOT prove raw source snapshots unchanged.
 */
function invProductIndexStageFingerprint_(stage) {
  if(!stage||stage.ready!==true||!Array.isArray(stage.headers)||
      !Array.isArray(stage.rows)||stage.count!==stage.rows.length||
      stage.headers.length===0||
      stage.rows.some(row=>!Array.isArray(row)||row.length!==stage.headers.length))
    throw new Error('Valid complete ProductIndex stage required');
  const payload=JSON.stringify({format:'product-index-stage-v1',
    headers:stage.headers,rows:stage.rows,count:stage.count});
  return {format:'product-index-stage-v1',count:stage.count,
    sha256:invProductIndexSha256_(payload)};
}
function invProductIndexVerifyStageFingerprint_(stage,expected) {
  if(!expected||expected.format!=='product-index-stage-v1'||
      !/^[a-f0-9]{64}$/.test(String(expected.sha256||'')))
    return {ok:false,reason:'Trusted stage fingerprint required'};
  try {
    const actual=invProductIndexStageFingerprint_(stage);
    if(actual.count!==expected.count||actual.sha256!==expected.sha256)
      return {ok:false,reason:'ProductIndex staged data changed'};
    return {ok:true,count:actual.count};
  }catch(error){
    return {ok:false,reason:String(error.message||error)};
  }
}

/** Pure fingerprints of all five source tables as read for ProductIndex. */
function invProductIndexSourceFingerprints_(sources) {
  const names=['raw','finishedGoods','spiritsProducts','releases','subtypes'];
  if(!sources||names.some(name=>!Array.isArray(sources[name])))
    throw new Error('All five ProductIndex source snapshots required');
  const result={format:'product-index-sources-v1',tables:{}};
  for(const name of names){
    const rows=sources[name];
    if(rows.some(row=>!row||typeof row!=='object'||Array.isArray(row)))
      throw new Error('Invalid ProductIndex source row: '+name);
    // Sort object keys to make property insertion order irrelevant.
    const canonical=rows.map(row=>Object.fromEntries(
      Object.keys(row).sort().map(key=>[key,row[key]])));
    result.tables[name]={count:rows.length,
      sha256:invProductIndexSha256_(JSON.stringify(canonical))};
  }
  return result;
}
function invProductIndexVerifySourceFingerprints_(sources,expected) {
  if(!expected||expected.format!=='product-index-sources-v1')
    return {ok:false,reason:'Trusted source fingerprints required'};
  try{
    const actual=invProductIndexSourceFingerprints_(sources);
    if(JSON.stringify(actual)!==JSON.stringify(expected))
      return {ok:false,reason:'ProductIndex source snapshots changed'};
    return {ok:true};
  }catch(error){return {ok:false,reason:String(error.message||error)};}
}

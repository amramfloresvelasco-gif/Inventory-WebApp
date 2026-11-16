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
function invProductIndexValidateSourceFingerprint_(value) {
  const names=['raw','finishedGoods','spiritsProducts','releases','subtypes'];
  if(!value||value.format!=='product-index-sources-v1'||
      !value.tables||typeof value.tables!=='object'||
      Object.keys(value.tables).length!==names.length)
    return false;
  return names.every(name=>{
    const table=value.tables[name];
    return table&&Number.isSafeInteger(table.count)&&table.count>=0&&
      typeof table.sha256==='string'&&/^[a-f0-9]{64}$/.test(table.sha256);
  });
}
function invProductIndexVerifySourceFingerprints_(sources,expected) {
  if(!invProductIndexValidateSourceFingerprint_(expected))
    return {ok:false,reason:'Trusted source fingerprints required'};
  try{
    const actual=invProductIndexSourceFingerprints_(sources);
    if(Object.keys(actual.tables).some(name=>
      actual.tables[name].count!==expected.tables[name].count||
      actual.tables[name].sha256!==expected.tables[name].sha256))
      return {ok:false,reason:'ProductIndex source snapshots changed'};
    return {ok:true};
  }catch(error){return {ok:false,reason:String(error.message||error)};}
}

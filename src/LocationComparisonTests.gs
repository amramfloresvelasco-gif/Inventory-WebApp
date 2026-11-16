/** Run manually in Apps Script. Pure tests: no Sheets reads or writes. */
function testInventoryLocationComparisonRules() {
  const cases=[
    ['neither team',false,false,0,'neutral'],
    ['team A only',true,false,0,'yellow'],
    ['team B only',false,true,0,'yellow'],
    ['both matching',true,true,0,'green'],
    ['both mismatch',true,true,1,'red'],
    ['both EMPTY',true,true,0,'green'],
    ['one EMPTY only',true,false,0,'yellow']
  ];
  let checked=0;
  for(const [name,a,b,m,expected] of cases){
    const actual=invLocationColor_(a,b,m);
    if(actual!==expected)throw new Error(name+': expected '+expected+' got '+actual);
    checked++;
  }
  const a=new Map([['P1|Case',10]]),b=new Map([['P1|Case',10]]);
  const tests=[
    ['matching quantities',a,b,false,false,1,1,0],
    ['different quantities',a,new Map([['P1|Case',9]]),false,false,1,1,1],
    ['different products',a,new Map([['P2|Case',10]]),false,false,1,1,2],
    ['EMPTY A versus B items',new Map(),b,true,false,0,1,2],
    ['EMPTY B versus A items',a,new Map(),false,true,1,0,2],
    ['both EMPTY',new Map(),new Map(),true,true,0,0,0],
    ['same-team EMPTY and items',a,new Map(),true,false,1,0,2],
    ['no entries',new Map(),new Map(),false,false,0,0,0]
  ];
  for(const [name,ma,mb,ea,eb,ca,cb,expected] of tests){
    const actual=invLocationDifferences_(ma,mb,ea,eb,ca,cb).length;
    if(actual!==expected)throw new Error(name+': expected '+expected+' differences got '+actual);
    checked++;
  }
  // Transition checks: statuses are derived from current active submissions, not latched.
  const transitions=[
    ['A starts',true,false,new Map([['P1|Case',10]]),new Map(),'yellow'],
    ['B partially counts',true,true,new Map([['P1|Case',10],['P2|Case',4]]),new Map([['P1|Case',10]]),'red'],
    ['B catches up',true,true,new Map([['P1|Case',10],['P2|Case',4]]),new Map([['P1|Case',10],['P2|Case',4]]),'green'],
    ['A corrects quantity',true,true,new Map([['P1|Case',11]]),new Map([['P1|Case',10]]),'red'],
    ['A removes last entry',false,true,new Map(),new Map([['P1|Case',10]]),'yellow'],
    ['both entries removed',false,false,new Map(),new Map(),'neutral']
  ];
  for(const [name,startedA,startedB,ma,mb,expected] of transitions){
    const mismatch=invLocationDifferences_(ma,mb,false,false,ma.size,mb.size).length;
    const actual=invLocationColor_(startedA,startedB,mismatch);
    if(actual!==expected)throw new Error(name+': expected '+expected+' got '+actual);
    checked++;
  }
  const edgeCases=[
    ['EMPTY A with same-team items',new Map([['P1|Case',2]]),new Map(),true,false,1,0,1],
    ['EMPTY B with same-team items',new Map(),new Map([['P1|Case',2]]),false,true,0,1,1],
    ['EMPTY A and B with A items',new Map([['P1|Case',2]]),new Map(),true,true,1,0,2],
    ['same product different UOM',new Map([['P1|Case',1]]),new Map([['P1|Bottle',1]]),false,false,1,1,2],
    ['fractional equivalent match',new Map([['P1|Case',0.5]]),new Map([['P1|Case',0.5]]),false,false,1,1,0]
  ];
  for(const [name,ma,mb,ea,eb,ca,cb,expected] of edgeCases){
    const actual=invLocationDifferences_(ma,mb,ea,eb,ca,cb).length;
    if(actual!==expected)throw new Error(name+': expected '+expected+' got '+actual);
    checked++;
  }
  Logger.log('PASS '+checked+' pure location comparison assertions; no database accessed.');
  return {ok:true,assertions:checked};
}

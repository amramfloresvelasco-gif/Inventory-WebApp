/** Pure location status rule; no Finish Location action. */
function invLocationColor_(startedA,startedB,mismatchCount) {
  if(!startedA&&!startedB)return 'neutral';
  if(!startedA||!startedB)return 'yellow';
  return mismatchCount>0?'red':'green';
}
/** Location comparison is session-scoped and read-only. Never infer EMPTY from missing entries. */
function invLocationComparison_(sessionId) {
  invSession_(sessionId);
  const locations=invRows_('Locations').filter(x=>String(x.Active).toLowerCase()==='true');
  const products=new Map(invRows_('ProductIndex').map(x=>[String(x.WSItemID),x]));
  const grouped=new Map(), invalid=[];
  const emptyByLocation=new Map();
  for(const r of invRows_('CountEntries')) {
    if(String(r.SessionID)!==sessionId||String(r.Status).toUpperCase()!=='ACTIVE')continue;
    const team=String(r.Team).toUpperCase(),loc=String(r.LocationID),id=String(r.WSItemID);
    const p=products.get(id),n=Number(r.Quantity),uom=String(r.UOM);
    if(String(r.EntryMethod).trim().toUpperCase()==='EMPTY') {
      if(!['A','B'].includes(team)){invalid.push({entryId:String(r.EntryID),reason:'Invalid EMPTY team'});continue;}
      if(!emptyByLocation.has(loc))emptyByLocation.set(loc,new Set());
      emptyByLocation.get(loc).add(team);
      continue;
    }
    if(!['A','B'].includes(team)||!p||!Number.isFinite(n)||n<0){
      invalid.push({entryId:String(r.EntryID),reason:'Invalid team/product/quantity'});continue;
    }
    const fg=String(p.ClassOfMaterial).toLowerCase()==='finished good';
    let amount=n,unit=uom;
    if(fg){
      const perCase=Number(p.UnitsPerCase);
      if(uom==='Bottle'&&perCase>0)amount=n/perCase;
      else if(uom!=='Case'){invalid.push({entryId:String(r.EntryID),reason:'Invalid finished goods UOM'});continue;}
      unit='Case';
    }else if(!INV_RAW_UOMS.includes(uom)||uom!==String(p.DefaultUOM)){
      invalid.push({entryId:String(r.EntryID),reason:'Invalid material UOM'});continue;
    }
    if(!grouped.has(loc))grouped.set(loc,{A:new Map(),B:new Map(),countA:0,countB:0});
    const g=grouped.get(loc),key=id+'|'+unit;
    g[team].set(key,(g[team].get(key)||0)+amount);
    g['count'+team]++;
  }
  const statuses=invRows_('LocationStatus').filter(x=>String(x.SessionID)===sessionId);
  const byLoc=new Map(statuses.map(x=>[String(x.LocationID),x]));
  const result=locations.map(l=>{
    const id=String(l.LocationID),g=grouped.get(id)||{A:new Map(),B:new Map(),countA:0,countB:0};
    const record=byLoc.get(id);
    const empty=emptyByLocation.get(id)||new Set();
    const startedA=g.countA>0||empty.has('A')||!!(record&&String(record.TeamAStarted).toLowerCase()==='true');
    const startedB=g.countB>0||empty.has('B')||!!(record&&String(record.TeamBStarted).toLowerCase()==='true');
    const keys=new Set([...g.A.keys(),...g.B.keys()]);
    const differences=[...keys].filter(k=>Math.abs((g.A.get(k)||0)-(g.B.get(k)||0))>1e-8);
    if(empty.has('A')&&g.countB>0)differences.push('EMPTY_A_VS_ITEMS_B');
    if(empty.has('B')&&g.countA>0)differences.push('EMPTY_B_VS_ITEMS_A');
    if(empty.has('A')&&g.countA>0)differences.push('EMPTY_A_AND_ITEMS_A');
    if(empty.has('B')&&g.countB>0)differences.push('EMPTY_B_AND_ITEMS_B');
    // No Finish Location action: status follows submitted counts automatically.
    // A dedicated EMPTY/NO COUNT entry is required for truly empty locations.
    const color=invLocationColor_(startedA,startedB,differences.length);
    return {locationId:id,warehouse:String(l.Warehouse),bay:String(l.Bay),
      color,startedA,startedB,emptyA:empty.has('A'),emptyB:empty.has('B'),entryCountA:g.countA,entryCountB:g.countB,
      mismatchCount:differences.length,differences};
  });
  const allGreen=invalid.length===0&&result.length>0&&result.every(x=>x.color==='green');
  return {sessionId,locations:result,invalid,
    allGreen,freezeAllowed:false,
    note:'EMPTY entries participate in mismatch detection; freeze validation pending.'};
}
function apiInventoryAdminLocationComparison(input) {
  invRequireAdmin_();
  const id=String(input&&input.sessionId||'').trim();
  if(!id)throw new Error('Session required.');
  return invLocationComparison_(id);
}

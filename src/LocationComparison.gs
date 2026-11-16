/** Location comparison is session-scoped and read-only. Never infer EMPTY from missing entries. */
function invLocationComparison_(sessionId) {
  invSession_(sessionId);
  const locations=invRows_('Locations').filter(x=>String(x.Active).toLowerCase()==='true');
  const products=new Map(invRows_('ProductIndex').map(x=>[String(x.WSItemID),x]));
  const grouped=new Map(), invalid=[];
  for(const r of invRows_('CountEntries')) {
    if(String(r.SessionID)!==sessionId||String(r.Status).toUpperCase()!=='ACTIVE')continue;
    const team=String(r.Team).toUpperCase(),loc=String(r.LocationID),id=String(r.WSItemID);
    const p=products.get(id),n=Number(r.Quantity),uom=String(r.UOM);
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
    const startedA=g.countA>0||!!(record&&String(record.TeamAStarted).toLowerCase()==='true');
    const startedB=g.countB>0||!!(record&&String(record.TeamBStarted).toLowerCase()==='true');
    const keys=new Set([...g.A.keys(),...g.B.keys()]);
    const differences=[...keys].filter(k=>Math.abs((g.A.get(k)||0)-(g.B.get(k)||0))>1e-8);
    // Both teams explicitly finishing a location is NOT yet supported.
    // Yellow indicates work in progress even when quantities happen to agree.
    const color=differences.length?'red':(startedA||startedB?'yellow':'neutral');
    return {locationId:id,warehouse:String(l.Warehouse),bay:String(l.Bay),
      color,startedA,startedB,entryCountA:g.countA,entryCountB:g.countB,
      mismatchCount:differences.length,differences};
  });
  return {sessionId,locations:result,invalid,
    allGreen:false,freezeAllowed:false,
    note:'Explicit team completion/EMPTY verification required before green; never freeze from this preview.'};
}
function apiInventoryAdminLocationComparison(input) {
  invRequireAdmin_();
  const id=String(input&&input.sessionId||'').trim();
  if(!id)throw new Error('Session required.');
  return invLocationComparison_(id);
}

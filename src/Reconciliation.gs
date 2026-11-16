/** Read-only reconciliation preview. No WS writes, no inventory freeze. */
function invReconciliationPreview_(sessionId) {
  const session=invSession_(sessionId);
  const snapshotId=String(session.OriginalWSSnapshotID||'').trim();
  if(!snapshotId)throw new Error('Original WS snapshot required.');
  const snapshot=invRows_('WSSnapshots').find(s=>String(s.SnapshotID)===snapshotId);
  if(!snapshot||String(snapshot.Status).toUpperCase()!=='ACTIVE')
    throw new Error('Original snapshot not active.');
  const products=new Map(invRows_('ProductIndex').map(p=>[String(p.WSItemID),p]));
  const ws=new Map(), invalid=[], physical={A:new Map(),B:new Map()};
  function add(map,id,amount) {map.set(id,(map.get(id)||0)+amount);}
  for(const r of invRows_('WSRows')) {
    if(String(r.SnapshotID)!==snapshotId)continue;
    const id=String(r.WSItemID),p=products.get(id);
    if(!p){invalid.push({id,reason:'WS product missing from catalog'});continue;}
    const fg=String(p.ClassOfMaterial).toLowerCase()==='finished good';
    const uom=String(r.UOM),n=Number(r.Quantity);
    if(!Number.isFinite(n)){invalid.push({id,reason:'Invalid WS source quantity'});continue;}
    let effective=fg?n:invNormalizeRawQuantity_(uom,n);
    if(fg) {
      const units=Number(p.UnitsPerCase);
      if(uom==='Bottle'&&units>0)effective=n/units;
      else if(uom!=='Case'){invalid.push({id,reason:'Invalid FG WS UOM'});continue;}
    }
    add(ws,id,effective);
  }
  for(const r of invRows_('CountEntries')) {
    if(String(r.SessionID)!==sessionId||String(r.Status).toUpperCase()!=='ACTIVE')continue;
    const team=String(r.Team).toUpperCase();
    if(!physical[team]){invalid.push({id:String(r.WSItemID),reason:'Unknown team'});continue;}
    const id=String(r.WSItemID),p=products.get(id);
    if(!p){invalid.push({id,reason:'Count product missing from catalog'});continue;}
    const fg=String(p.ClassOfMaterial).toLowerCase()==='finished good';
    const n=Number(r.Quantity),uom=String(r.UOM);
    if(!Number.isFinite(n)||n<0){invalid.push({id,reason:'Invalid count quantity'});continue;}
    let amount=n;
    if(fg){
      if(uom==='Bottle'&&Number(p.UnitsPerCase)>0)amount=n/Number(p.UnitsPerCase);
      else if(uom!=='Case'){invalid.push({id,reason:'Invalid FG count UOM'});continue;}
    }else if(!INV_RAW_UOMS.includes(uom)||uom!==String(p.DefaultUOM)){
      invalid.push({id,reason:'Invalid raw material count UOM'});continue;
    }
    add(physical[team],id,amount);
  }
  const ids=new Set([...ws.keys(),...physical.A.keys(),...physical.B.keys()]);
  const items=[...ids].map(id=>{
    const a=physical.A.get(id)||0,b=physical.B.get(id)||0,original=ws.get(id)||0;
    const matched=Math.abs(a-b)<1e-8;
    return {id,name:String(products.get(id)&&products.get(id).ItemName||''),
      unit:String(products.get(id)&&String(products.get(id).ClassOfMaterial).toLowerCase()==='finished good'?'Case':products.get(id)&&products.get(id).DefaultUOM||''),
      teamA:a,teamB:b,teamsMatch:matched,originalWS:original,
      physical:matched?a:null,difference:matched?a-original:null};
  });
  return {sessionId,snapshotId,items,invalid,readyForReview:invalid.length===0&&items.every(x=>x.teamsMatch),
    note:'Preview only; zero counts are not proof of a completed location. Location map completion gate is pending.'};
}
function apiInventoryAdminReconciliationPreview(input) {
  invRequireAdmin_();
  const sessionId=String(input&&input.sessionId||'').trim();
  if(!sessionId)throw new Error('Session required.');
  return invReconciliationPreview_(sessionId);
}

/** Isolated staging web map. Read-only; never deploy to production. */
function doGet() {
  invAssertStagingOnly_();
  invRequireAdmin_();
  return HtmlService.createHtmlOutputFromFile('StagingMap')
    .setTitle('BMD Inventory — STAGING Map');
}
/** Stage 143: pure, fail-closed integrity gate for map locations. */
function invStagingMapIntegrity143_(locations,entries,sessionId) {
  const ids=new Set(),duplicateLocationIds=[],invalidEntries=[];
  for(const l of locations) {
    const id=String(l.LocationID).trim();
    if(!id||ids.has(id))duplicateLocationIds.push(id||'(blank)');
    ids.add(id);
  }
  for(const e of entries) {
    if(String(e.SessionID)!==sessionId||String(e.Status).toUpperCase()!=='ACTIVE')continue;
    const id=String(e.LocationID).trim();
    if(!ids.has(id))invalidEntries.push({entryId:String(e.EntryID),locationId:id,reason:'Unknown or inactive location'});
  }
  return {ok:duplicateLocationIds.length===0&&invalidEntries.length===0,
    duplicateLocationIds,invalidEntries};
}
function apiStagingMapReadOnly142() {
  invAssertStagingOnly_();
  invRequireAdmin_();
  const sessionId='STAGING-SESSION-001';
  invSession_(sessionId);
  const locations=invRows_('Locations').filter(x=>String(x.Active).toLowerCase()==='true');
  const entries=invRows_('CountEntries');
  const integrity=invStagingMapIntegrity143_(locations,entries,sessionId);
  // Never publish a reassuring green card when the location index is corrupt.
  if(!integrity.ok)return {stagingOnly:true,readOnly:true,databaseWrites:0,
    sessionId,cards:[],integrity};
  const cards=locations.map(l=>{
    const locationId=String(l.LocationID);
    const status=invStagingLocationMapStatus140_(sessionId,locationId);
    const active=entries.filter(x=>String(x.SessionID)===sessionId&&String(x.LocationID)===locationId&&String(x.Status).toUpperCase()==='ACTIVE');
    const a=active.filter(x=>String(x.Team).toUpperCase()==='A').length;
    const b=active.filter(x=>String(x.Team).toUpperCase()==='B').length;
    const color=status.status==='MATCHED'?'green':status.status==='MISMATCH'?'red':status.status==='IN_PROGRESS'?'yellow':'neutral';
    return {locationId,warehouse:String(l.Warehouse),bay:String(l.Bay),color,status:status.status,entryCountA:a,entryCountB:b,mismatchCount:status.mismatchCount};
  });
  return {stagingOnly:true,readOnly:true,databaseWrites:0,sessionId,cards,integrity};
}
/** Stage 143 pure tests; no spreadsheet mutation. */
function testStagingMapIntegrity143() {
  invAssertStagingOnly_();
  invRequireAdmin_();
  const loc=id=>({LocationID:id});
  const row=(id,location)=>({EntryID:id,SessionID:'S',Status:'ACTIVE',LocationID:location});
  const scenarios=[
    {name:'valid',l:[loc('L')],e:[row('E','L')],ok:true},
    {name:'unknown active location',l:[loc('L')],e:[row('E','OTHER')],ok:false},
    {name:'duplicate location',l:[loc('L'),loc('L')],e:[],ok:false},
    {name:'blank location',l:[loc('')],e:[],ok:false},
    {name:'deleted orphan ignored',l:[loc('L')],e:[{...row('E','OTHER'),Status:'DELETED'}],ok:true},
    {name:'other session ignored',l:[loc('L')],e:[{...row('E','OTHER'),SessionID:'OTHER'}],ok:true}
  ];
  for(const s of scenarios) {
    const r=invStagingMapIntegrity143_(s.l,s.e,'S');
    if(r.ok!==s.ok)throw Error('FAIL '+s.name+': '+JSON.stringify(r));
  }
  const result={phase:'STAGING_MAP_INTEGRITY_143',stagingOnly:true,
    readOnly:true,databaseWrites:0,pureScenariosPassed:scenarios.length};
  console.log(JSON.stringify(result));return result;
}

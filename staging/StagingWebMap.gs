/** Isolated staging web map. Read-only; never deploy to production. */
function doGet() {
  invAssertStagingOnly_();
  invRequireAdmin_();
  return HtmlService.createHtmlOutputFromFile('StagingMap')
    .setTitle('BMD Inventory — STAGING Map');
}
function apiStagingMapReadOnly142() {
  invAssertStagingOnly_();
  invRequireAdmin_();
  const sessionId='STAGING-SESSION-001';
  invSession_(sessionId);
  const locations=invRows_('Locations').filter(x=>String(x.Active).toLowerCase()==='true');
  const entries=invRows_('CountEntries');
  const cards=locations.map(l=>{
    const locationId=String(l.LocationID);
    const status=invStagingLocationMapStatus140_(sessionId,locationId);
    const active=entries.filter(x=>String(x.SessionID)===sessionId&&String(x.LocationID)===locationId&&String(x.Status).toUpperCase()==='ACTIVE');
    const a=active.filter(x=>String(x.Team).toUpperCase()==='A').length;
    const b=active.filter(x=>String(x.Team).toUpperCase()==='B').length;
    const color=status.status==='MATCHED'?'green':status.status==='MISMATCH'?'red':status.status==='IN_PROGRESS'?'yellow':'neutral';
    return {locationId,warehouse:String(l.Warehouse),bay:String(l.Bay),color,status:status.status,entryCountA:a,entryCountB:b,mismatchCount:status.mismatchCount};
  });
  return {stagingOnly:true,readOnly:true,databaseWrites:0,sessionId,cards};
}

/** Read-only smoke tests. Run in a separate, authorized Apps Script project.
 * Does not create sessions, users, or counts.
 */
function testInventorySchemaReadOnly() {
  const expected=['AppUsers','InventorySessions','Locations','ProductIndex','CountEntries'];
  expected.forEach(name=>{invRows_(name);});
  const locations=invRows_('Locations');
  const pulaski=locations.filter(x=>x.Warehouse==='Pulaski').length;
  const lynnville=locations.filter(x=>x.Warehouse==='Lynnville').length;
  if(locations.length!==138||pulaski!==100||lynnville!==38)
    throw new Error('Location seed mismatch: '+JSON.stringify({total:locations.length,pulaski,lynnville}));
  const users=invRows_('AppUsers');
  const admin=users.find(x=>String(x.Email).toLowerCase()==='abe.flores@bsbco.com');
  if(!admin||String(admin.Role).toLowerCase()!=='administrator'||String(admin.Status).toLowerCase()!=='active')
    throw new Error('Initial administrator record missing/inactive.');
  Logger.log('PASS: schema, 138 locations, initial administrator');
}

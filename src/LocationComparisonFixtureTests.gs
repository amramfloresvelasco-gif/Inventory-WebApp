/** Pure fixture tests. Run manually in Apps Script; no database access or writes. */
function testInventoryLocationComparisonFixtures() {
  const session='TEST-SESSION';
  const locations=[{LocationID:'L1',Warehouse:'MAIN',Bay:'01',Active:true}];
  const products=[
    {WSItemID:'FG',ClassOfMaterial:'Finished Good',UnitsPerCase:12},
    {WSItemID:'RAW',ClassOfMaterial:'Raw Material',DefaultUOM:'Each'}
  ];
  let checks=0;
  function check(name,entries,color,invalidCount,mismatches) {
    const result=invBuildLocationComparison_(session,locations,products,entries);
    const loc=result.locations[0];
    if(loc.color!==color||result.invalid.length!==invalidCount||
       loc.mismatchCount!==mismatches||result.freezeAllowed!==false)
      throw new Error(name+': '+JSON.stringify({color:loc.color,invalid:result.invalid,mismatches:loc.mismatchCount}));
    checks++;
  }
  function item(id,team,product,quantity,uom) {
    return {EntryID:id,SessionID:session,LocationID:'L1',Team:team,
      WSItemID:product,Quantity:quantity,UOM:uom,EntryMethod:'Manual',Status:'ACTIVE'};
  }
  function empty(id,team) {
    return {EntryID:id,SessionID:session,LocationID:'L1',Team:team,
      WSItemID:'',Quantity:0,UOM:'',EntryMethod:'EMPTY',Status:'ACTIVE'};
  }
  const a=item('A1','A','FG',1,'Case'),b=item('B1','B','FG',12,'Bottle');
  check('unstarted',[],'neutral',0,0);
  check('team A started',[a],'yellow',0,1);
  check('case-bottle equivalent',[a,b],'green',0,0);
  check('quantity disagreement',[a,item('B2','B','FG',11,'Bottle')],'red',0,1);
  check('deleted A ignored',[{...a,Status:'DELETED'},b],'yellow',0,1);
  check('both deleted',[{...a,Status:'DELETED'},{...b,Status:'DELETED'}],'neutral',0,0);
  check('both EMPTY',[empty('EA','A'),empty('EB','B')],'green',0,0);
  check('one EMPTY',[empty('EA','A')],'yellow',0,0);
  check('EMPTY versus items',[empty('EA','A'),b],'red',0,2);
  check('blank quantity invalid',[item('A2','A','RAW','','Each')],'neutral',1,0);
  check('unknown location invalid',[{...a,LocationID:'UNKNOWN'}],'neutral',1,0);
  const missing=invBuildLocationComparison_(session,locations,[{...products[0],UnitsPerCase:''}], [a,b]);
  if(missing.invalid.length!==2||missing.locations[0].color!=='neutral')throw new Error('Missing FG conversion not rejected');
  checks++;
  const inactive=invBuildLocationComparison_(session,[{...locations[0],Active:false}],products,[a]);
  if(inactive.invalid.length!==1||inactive.locations.length!==0)throw new Error('Inactive location not rejected');
  checks++;
  Logger.log('PASS '+checks+' location fixture assertions; no database accessed.');
  return {ok:true,assertions:checks};
}

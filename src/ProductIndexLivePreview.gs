/** Live, read-only ProductIndex preview. No writes, no import or cache mutation. */
const INV_PRODUCT_PREVIEW_RAW_ID='1ULhJ2aUGQ9IPO3rkEHzixyNdBvJzU0t2poxLMKSFD8Q';
const INV_PRODUCT_PREVIEW_FG_ID='15tQfyGJtfAU02JNlf2cV0MY_Pai6F9sVLSl1EMReJMw';
function invProductPreviewRows_(id,tab,required,maxRows) {
  const sheet=SpreadsheetApp.openById(id).getSheetByName(tab);
  if(!sheet)throw new Error('Missing preview source tab: '+tab);
  const last=sheet.getLastRow(),columns=sheet.getLastColumn();
  if(last<1||columns<1||last>maxRows+1||columns>100)
    throw new Error('Unexpected preview source size: '+tab);
  const values=sheet.getRange(1,1,last,columns).getDisplayValues();
  const headers=values.shift().map(x=>String(x).trim());
  for(const key of required)if(headers.filter(x=>x===key).length!==1)
    throw new Error('Missing or duplicate preview column '+key+' in '+tab);
  return values.filter(row=>row.some(x=>String(x).trim()))
    .map(row=>Object.fromEntries(headers.map((key,i)=>[key,row[i]])));
}
/** Administrator-only: fresh WS/SPIRITS reads and full mapper + diff. */
function apiInventoryAdminProductIndexPreview() {
  invRequireAdmin_();
  const started=Date.now();
  const phases=[];
  let phaseStart=Date.now();
  function markPhase(name){const now=Date.now();phases.push({name,elapsedMs:now-phaseStart});phaseStart=now;}
  const raw=invProductPreviewRows_(INV_PRODUCT_PREVIEW_RAW_ID,'LiveData',
    ['RawMaterialId','MaterialName','ClassOfMaterial','UnitOfMeasure'],20000);
  markPhase('Read WS raw materials');
  const fg=invProductPreviewRows_(INV_PRODUCT_PREVIEW_FG_ID,'LiveData',
    ['Master Id','Master Name'],20000);
  markPhase('Read WS finished goods');
  const products=invProductPreviewRows_(INV_SPIRITS_ID,'Products',
    ['ProductID','WSFinishedGoodsID','BrandID','SubtypeID','UnitsPerCase'],10000);
  markPhase('Read SPIRITS products');
  const releases=invProductPreviewRows_(INV_SPIRITS_ID,'Releases',
    ['ProductID','ReleaseType'],10000);
  markPhase('Read SPIRITS releases');
  const subtypes=invProductPreviewRows_(INV_SPIRITS_ID,'BrandReleaseTypes',
    ['BrandReleaseTypeID','BrandID','ReleaseTypeName','UnitsPerCase'],10000);
  markPhase('Read SPIRITS subtypes');
  const packs=invResolveSpiritsCasePacks_(products,releases,subtypes);
  markPhase('Resolve case packs');
  const preview=invPreviewProductIndex_(raw,fg,packs.rows);
  markPhase('Validate ProductIndex sources');
  const sheet=invSheet_('ProductIndex');
  const expected=INV_HEADERS.ProductIndex;
  const actual=sheet.getRange(1,1,1,expected.length).getDisplayValues()[0];
  if(actual.join('|')!==expected.join('|'))
    throw new Error('ProductIndex header mismatch; preview aborted.');
  const existing=invRows_('ProductIndex');
  markPhase('Read existing ProductIndex');
  const plan=invPlanProductIndexSync_(preview,existing);
  markPhase('Calculate ProductIndex diff');
  const issues=[...packs.issues,...preview.issues,...plan.issues];
  const ready=packs.ready&&preview.ready&&plan.ready&&issues.length===0;
  return {
    readOnly:true,ready,counts:preview.counts,
    sourceRows:{raw:raw.length,finishedGoods:fg.length,spiritsProducts:products.length,
      releases:releases.length,subtypes:subtypes.length,verifiedCasePacks:packs.rows.length},
    diff:{adds:plan.adds.length,updates:plan.updates.length,
      unchanged:plan.unchanged.length,missing:plan.missing.length},
    issueCount:issues.length,issues:issues.slice(0,50),
    elapsedMs:Date.now()-started,phases,
    note:'Read-only preview. No ProductIndex import is exposed by this action.'
  };
}

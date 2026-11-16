/** Pure finished-goods pallet expansion; never writes Sheets.
 * One child per full pallet, one optional partial case child, one loose-bottle child.
 * Parent is metadata only, not a counted row.
 */
function invPlanPalletChildren_(input) {
  if(!input||typeof input!=='object')throw new Error('Pallet details required.');
  const parent=String(input.parentSubmissionId||'').trim();
  if(!/^[A-Za-z0-9_-]{12,90}$/.test(parent))
    throw new Error('Invalid parent submission ID.');
  const numeric=(value,name)=>{
    if(typeof value!=='number'||!Number.isSafeInteger(value)||value<0)
      throw new Error(name+' must be a nonnegative whole number.');
    return value;
  };
  const pallets=numeric(input.pallets===undefined?1:input.pallets,'Pallet multiplier');
  const cases=numeric(input.casesPerPallet,'Cases per pallet');
  const partial=numeric(input.partialCases===undefined?0:input.partialCases,'Partial cases');
  const bottles=numeric(input.looseBottles===undefined?0:input.looseBottles,'Loose bottles');
  if(pallets>100||pallets+(partial>0?1:0)+(bottles>0?1:0)>102)
    throw new Error('Too many child records in one submission.');
  if(pallets>0&&cases===0)throw new Error('Cases per pallet required.');
  if(pallets===0&&cases!==0)throw new Error('Cases without a pallet multiplier.');
  if(pallets===0&&partial===0&&bottles===0)
    throw new Error('At least one counted quantity required.');
  if(!Number.isSafeInteger(pallets*cases+partial))
    throw new Error('Case total exceeds safe integer range.');
  const children=[];
  const suffix=index=>{
    let n=index+1,out='';
    do{n--;out=String.fromCharCode(65+n%26)+out;n=Math.floor(n/26);}while(n);
    return out;
  };
  function add(quantity,uom,kind){
    const index=children.length;
    children.push({entryId:parent+'-'+suffix(index),parentSubmissionId:parent,
      quantity,uom,kind,palletMultiplier:1});
  }
  for(let i=0;i<pallets;i++)add(cases,'Case','full-pallet');
  if(partial>0)add(partial,'Case','partial-pallet');
  if(bottles>0)add(bottles,'Bottle','loose-bottles');
  return {parentSubmissionId:parent,children,childCount:children.length,
    totalCases:pallets*cases+partial,totalLooseBottles:bottles,
    readOnly:true};
}

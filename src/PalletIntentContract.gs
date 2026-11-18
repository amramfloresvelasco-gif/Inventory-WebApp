/** Canonical pallet submission intent, independent of counted rows.
 * A future server-owned journal must persist this BEFORE any child writes.
 * This pure contract neither creates a journal nor authorizes live saving.
 */
function invPalletIntent_(request,identity) {
  if(!request||typeof request!=='object'||!identity||typeof identity!=='object')
    throw new Error('Submission and authenticated identity required.');
  const required=(v,label,max=120)=>{
    if(typeof v!=='string'||!v.trim()||v.length>max)throw new Error(label+' required.');
    return v.trim();
  };
  const sessionId=required(request.sessionId,'Session');
  const locationId=required(request.locationId,'Location');
  const productId=required(request.productId,'Product');
  const email=required(identity.email,'Authenticated email',254).toLowerCase();
  const team=required(identity.team,'Authenticated team').toUpperCase();
  if(!['A','B'].includes(team))throw new Error('Invalid authenticated team.');
  const entryMethod=request.entryMethod===undefined?'Manual':request.entryMethod;
  if(!['Manual','Barcode','QR'].includes(entryMethod))throw new Error('Invalid entry method.');
  const notes=request.notes===undefined?'':request.notes;
  if(typeof notes!=='string'||notes.length>500)throw new Error('Invalid notes.');
  const plan=invPlanPalletChildren_({
    parentSubmissionId:request.parentSubmissionId,pallets:request.pallets,
    casesPerPallet:request.casesPerPallet,partialCases:request.partialCases,
    looseBottles:request.looseBottles
  });
  return {
    version:1,parentSubmissionId:plan.parentSubmissionId,
    sessionId,locationId,productId,team,email,entryMethod,notes,
    childCount:plan.childCount,totalCases:plan.totalCases,
    totalLooseBottles:plan.totalLooseBottles,
    children:plan.children.map(c=>({
      entryId:c.entryId,uom:c.uom,quantity:c.quantity,kind:c.kind
    }))
  };
}
/** Exact equality of canonical server-derived intent (no client trust).
 * The digest is not a signature; only a server-owned immutable record can
 * provide authoritative original intent.
 */
function invPalletIntentEqual_(left,right) {
  if(!left||!right)return false;
  return JSON.stringify(left)===JSON.stringify(right);
}

/** Build a canonical intent for the authenticated user and their explicit
 * Count A/B selection. Never accept an email or identity from the browser.
 * This helper is pure and does not authorize writes or bypass the journal.
 */
function invPalletIntentForUser_(request,user) {
  if(!user||typeof user.email!=='string'||!user.email.trim())
    throw new Error('Authenticated user required.');
  const team=String(request&&request.team||'').trim().toUpperCase();
  if(!['A','B'].includes(team))throw new Error('Select Count A or Count B.');
  return invPalletIntent_(request,{email:user.email,team});
}

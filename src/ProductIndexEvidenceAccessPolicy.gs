/**
 * Pure folder access policy for future ProductIndex evidence storage.
 * Requires an isolated folder without broad/domain/public permissions.
 * A Drive permission inspection adapter must supply complete permission data.
 * No Drive API access, no mutations, no public RPC.
 */
function invProductIndexEvidenceAccessCheck_(permissions,inspectionComplete) {
  const issues=[];
  if(inspectionComplete!==true||!Array.isArray(permissions))
    return {ready:false,issues:['Complete folder permission inspection required']};
  if(permissions.length===0)
    issues.push('No folder owner or administrator permission visible');
  let owners=0;
  for(const p of permissions){
    if(!p||!p.type||!p.role){issues.push('Incomplete permission record');continue;}
    const type=String(p.type).toLowerCase(),role=String(p.role).toLowerCase();
    if(type==='anyone'||type==='domain'||type==='group')
      issues.push('Broad or group access is not allowed');
    if(type!=='user'&&type!=='anyone'&&type!=='domain'&&type!=='group')
      issues.push('Unknown permission principal type');
    if(role==='owner')owners++;
    if(!['owner','organizer','fileorganizer','writer','reader','commenter'].includes(role))
      issues.push('Unknown permission role');
    if(type==='user'&&!String(p.emailAddress||'').trim())
      issues.push('User permission lacks an email');
  }
  if(owners===0)issues.push('Owner permission not confirmed');
  return {ready:issues.length===0,issues};
}

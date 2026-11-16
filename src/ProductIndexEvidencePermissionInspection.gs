/**
 * Read-only Drive permission inspection for ProductIndex evidence folder.
 * Private function, no public RPC, no writes. Requires Advanced Drive service.
 * If permissions are hidden/incomplete, fail closed instead of guessing.
 */
function invInspectProductIndexEvidenceFolderDisabled_() {
  const id=PropertiesService.getScriptProperties()
    .getProperty('INV_PRODUCT_INDEX_EVIDENCE_FOLDER_ID');
  if(!id)throw new Error('ProductIndex evidence folder not configured');
  if(typeof Drive==='undefined'||!Drive.Permissions||
      typeof Drive.Permissions.list!=='function')
    return {ready:false,issues:['Advanced Drive permission inspection unavailable'],
      inspectionComplete:false};
  try {
    const permissions=[];
    let pageToken;
    do {
      const options={fields:'nextPageToken,permissions(id,type,role,emailAddress,deleted,permissionDetails)',
        pageSize:100,supportsAllDrives:true};
      if(pageToken)options.pageToken=pageToken;
      const response=Drive.Permissions.list(id,options);
      if(!response||!Array.isArray(response.permissions))
        return {ready:false,inspectionComplete:false,
          issues:['Drive permission listing is incomplete']};
      permissions.push(...response.permissions);
      pageToken=response.nextPageToken;
      if(permissions.length>1000)
        return {ready:false,inspectionComplete:false,
          issues:['Drive permission listing exceeded safety limit']};
    }while(pageToken);
    // Shared-drive permissions can be inherited; do not infer safety from
    // only the folder's direct ACL. Require separate administrator review.
    const policy=invProductIndexEvidenceAccessCheck_(permissions,true);
    return {ready:false,inspectionComplete:true,policyReady:policy.ready,
      issues:[...policy.issues,
        'Administrator review of inherited/shared-drive access required'],
      permissionCount:permissions.length};
  }catch(error){
    return {ready:false,inspectionComplete:false,
      issues:['Drive permission inspection failed: '+String(error.message||error)]};
  }
}

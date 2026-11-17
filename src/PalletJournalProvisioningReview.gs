/** Pure, read-only provisioning assessment. Does not create or modify a Sheet. */
function invPalletJournalProvisioningDecision_(tabExists,actualHeaders,recordCount) {
  const expected=['ParentSubmissionID','SessionID','IntentJSON','Status','CreatedAt','CreatedBy'];
  if(tabExists!==true) return {state:'MISSING',safeToCreateWithApproval:true,canEnable:false};
  if(!Array.isArray(actualHeaders)||actualHeaders.length!==expected.length||
     actualHeaders.some((v,i)=>String(v)!==expected[i]))
    return {state:'SCHEMA_MISMATCH',safeToCreateWithApproval:false,canEnable:false};
  if(!Number.isSafeInteger(recordCount)||recordCount<0)
    return {state:'UNKNOWN_CONTENTS',safeToCreateWithApproval:false,canEnable:false};
  if(recordCount>0)
    return {state:'EXISTING_RECORDS_REVIEW',safeToCreateWithApproval:false,canEnable:false};
  return {state:'EMPTY_READY_FOR_ADMIN_REVIEW',safeToCreateWithApproval:false,canEnable:false};
}

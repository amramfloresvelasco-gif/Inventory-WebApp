/**
 * Disabled-by-design persistent evidence adapter for a FUTURE initial import.
 * Private helpers only: no public RPC calls these functions. Never writes
 * ProductIndex. Restricted Drive folder ID must be configured by an admin.
 *
 * Drive files are NOT intrinsically immutable: restrict folder permissions,
 * retain versions/audit, and enforce operator review before live use.
 */
function invProductIndexEvidenceFolder_() {
  const id=PropertiesService.getScriptProperties().getProperty('INV_PRODUCT_INDEX_EVIDENCE_FOLDER_ID');
  if(!id)throw new Error('ProductIndex evidence folder not configured');
  return DriveApp.getFolderById(id);
}
function invProductIndexEvidenceFileName_(importId,kind) {
  const id=String(importId||'');
  if(!/^[a-zA-Z0-9_-]{8,100}$/.test(id)||!['backup','journal'].includes(kind))
    throw new Error('Invalid evidence identifier');
  return 'product-index-'+id+'-'+kind+'.json';
}
function invProductIndexEvidenceWriteOnce_(folder,name,payload) {
  const iterator=folder.getFilesByName(name);
  if(iterator.hasNext())throw new Error('Evidence file already exists: '+name);
  const file=folder.createFile(name,JSON.stringify(payload),'application/json');
  // Verify through Drive readback, not the in-memory payload.
  const read=JSON.parse(file.getBlob().getDataAsString('UTF-8'));
  if(JSON.stringify(read)!==JSON.stringify(payload))
    throw new Error('Evidence persistence readback mismatch: '+name);
  return {fileId:file.getId(),data:read};
}
function invProductIndexEvidenceReadById_(folder,fileId,expectedName) {
  const file=DriveApp.getFileById(fileId);
  if(file.getName()!==expectedName||!folder.getFilesByName(expectedName).hasNext())
    throw new Error('Evidence file name/folder mismatch');
  let found=false;
  const files=folder.getFilesByName(expectedName);
  while(files.hasNext())if(files.next().getId()===fileId)found=true;
  if(!found)throw new Error('Evidence file is outside configured folder');
  return JSON.parse(file.getBlob().getDataAsString('UTF-8'));
}
/**
 * Internal persistence preparation; never called by production flow.
 * Backup and journal are two files, not an atomic transaction.
 * If the second creation fails, retain the first for forensic recovery.
 */
function invProductIndexPersistEvidenceDisabled_(stage,actor,importId,targetSnapshot) {
  if(!stage||!stage.ready||!actor)throw new Error('Valid stage and actor required');
  if(!targetSnapshot||!Array.isArray(targetSnapshot.rows)||
      targetSnapshot.rows.length!==0||
      JSON.stringify(targetSnapshot.headers)!==JSON.stringify(stage.headers))
    throw new Error('Initial ProductIndex target must be empty');
  const folder=invProductIndexEvidenceFolder_();
  const backupName=invProductIndexEvidenceFileName_(importId,'backup');
  const journalName=invProductIndexEvidenceFileName_(importId,'journal');
  if(folder.getFilesByName(backupName).hasNext()||
      folder.getFilesByName(journalName).hasNext())
    throw new Error('Import evidence ID already exists');
  const backup={importId,actor,immutable:true,
    headers:targetSnapshot.headers,rows:targetSnapshot.rows};
  const savedBackup=invProductIndexEvidenceWriteOnce_(folder,backupName,backup);
  const backupRecord={...backup,backupId:savedBackup.fileId};
  // Evidence is a logical snapshot, not a claim that Drive is WORM storage.
  const journal={importId,actor,backupId:savedBackup.fileId,durable:true,
    events:[
      invInitialProductIndexAuditEvent_(importId,'PREPARED',actor,{count:stage.count}),
      invInitialProductIndexAuditEvent_(importId,'BACKUP_VERIFIED',actor,
        {backupId:savedBackup.fileId})
    ]};
  const savedJournal=invProductIndexEvidenceWriteOnce_(folder,journalName,journal);
  const expected={backup:backupRecord,journal};
  const readback={backup:{...invProductIndexEvidenceReadById_(folder,savedBackup.fileId,backupName),
      backupId:savedBackup.fileId},
    journal:invProductIndexEvidenceReadById_(folder,savedJournal.fileId,journalName)};
  const check=invVerifyProductIndexEvidenceReadback_(stage,expected,readback,importId,actor);
  if(!check.ready)throw new Error('Persisted evidence verification failed: '+check.issues.join('; '));
  return {backupFileId:savedBackup.fileId,journalFileId:savedJournal.fileId,
    verified:true};
}

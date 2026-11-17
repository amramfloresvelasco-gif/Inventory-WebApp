const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync('src/Index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/);
assert(script,'Inline script missing');
new Function(script[1]);
for(const id of ['loadExtendedSnapshots','extendedSnapshot','viewExtended','exportExtended','extendedResults','ownershipRows'])
 assert(html.includes('id="'+id+'"'),'Missing UI control: '+id);
const csv=script[1].match(/const csvCell=v=>([^;]+);/);
assert(csv,'CSV formatter missing');
const format=new Function('v','return '+csv[1]);
assert.strictEqual(format('=SUM(1,1)'),'"\t=SUM(1,1)"');
assert.strictEqual(format('a"b'),'"a""b"');
assert(script[1].includes("lines.join('\\r\\n')"),'CSV must use CRLF row delimiters');
assert(script[1].includes("el('extendedSnapshot').addEventListener('change'"),'Snapshot change must invalidate export');
assert(script[1].includes('extendedRows=null;extendedMeta=null'),'Report cache must clear before reloading');
console.log('Inventory UI syntax and CSV safety checks passed');

for(const id of ['myTeam','teamAction','locationAction','locationStatus','qty'])
 assert(html.includes('id="'+id+'"'),'Missing count workflow control: '+id);
assert(!html.includes('id="userTeam"'),'Admin must not override counter team');
assert(!html.includes('id="userLocked"'),'Admin must not override counter team lock');
assert(script[1].includes("if(!/^[0-9]+$/.test(qtyText)"),'Client must reject blank or fractional quantities');
assert(script[1].includes("if(!data||!data.user.teamLocked)"),'Team lock required for count submissions');
assert(script[1].includes("updateTeamControls();"),'Submission controls must restore team gating');
console.log('Inventory counting UI guard checks passed');

for(const id of ['palletCount','partialCases','looseBottles','palletPreview'])
 assert(html.includes('id="'+id+'"'),'Missing pallet preview control: '+id);
assert(html.includes('Multi-pallet saving is not enabled yet.'),'Pallet preview must not imply live batch persistence');
console.log('Pallet preview UI controls passed');

assert(script[1].includes("if(palletCount!==1||partial!==0||bottles!==0)"),'Single-row Save must reject multi-child pallet preview');
console.log('Unsupported pallet batch Save guard passed');


// Stage 72: fail closed until a real Team A/B staging end-to-end approval.
assert(/<button\\b(?=[^>]*\\bid="savePalletFamily")(?=[^>]*\\bdisabled\\b)[^>]*>/.test(html),
  'Pallet family Save must remain disabled in the rendered UI');
assert(/id="savePalletFamily"[^>]*aria-disabled="true"/.test(html),
  'Pallet family Save must communicate its disabled state to assistive technology');
assert(!/\\.apiInventorySavePalletFamily\\s*\\(/.test(script[1]),
  'Unapproved pallet-family RPC must not be called from the employee UI');
assert(!/function\\s+apiInventorySavePalletFamily\\s*\\(/.test(
  fs.readFileSync('src/Code.gs','utf8')),
  'Unapproved public pallet-family RPC must not be exposed by Code.gs');
assert(html.includes('The separate Save count button records one count only.'),
  'Employee UI must distinguish single-count Save from pallet-family Save');
console.log('Stage 72: employee pallet-family Save remains gated; no public RPC exposed');

// Stage 72: preview validation must match server planner rules.
assert(script[1].includes('n>100||(n>0&&c===0)||(n===0&&c!==0)'),
 'Full pallet quantity and cases-per-pallet must be consistent');
assert(script[1].includes('!Number.isSafeInteger(totalCases)'),
 'Pallet preview must reject unsafe aggregate case counts');
assert(script[1].includes('totalCases===0&&bottles===0'),
 'Pallet preview must reject empty plans but allow loose-bottle-only plans');
console.log('Stage 72: pallet preview planner validation guards passed');

// Stage 78: read-only child breakdown must show the same child types as the planner.
assert(html.includes('id="palletPreviewDetails"'),'Detailed pallet preview container missing');
assert(script[1].includes("kind:'Full pallet '"),'Full pallets must be listed individually');
assert(script[1].includes("kind:'Partial pallet'"),'Partial pallet must have its own child');
assert(script[1].includes("kind:'Loose bottles'"),'Loose bottles must have their own child');
assert(script[1].includes("details.replaceChildren()"),'Invalid plans must clear stale child details');
assert(script[1].includes("item.textContent=child.kind"),'Child breakdown must use safe text rendering');
console.log('Stage 78: itemized read-only pallet preview guards passed');

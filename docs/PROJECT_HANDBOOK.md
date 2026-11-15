# Inventory Web App — Project Handbook

**Updated:** 2026-11-15  
**Repository:** https://github.com/amramfloresvelasco-gif/Inventory-WebApp  
**Branch:** main  
**Status:** Phase 1 requirements gathering; no implemented or deployed app yet.  
**Scope:** Separate, mobile-first Inventory Web App (Google Apps Script proposed, subject to performance and write-safety validation); do not change SPIRITS/V4 without explicit request.

## 1. Mission and operating principles

Build a fast, reliable inventory count tool for simultaneous employees, supporting phone-camera barcode scans and desktop Bluetooth scanners. Existing AppSheet/Apps Script inventory tools and repair scripts are references for expected functionality, **not** source to transplant. Their incomplete-entry and repair issues require a redesigned storage/write path.

Priorities: responsive scan-to-input flow; minimal typing; verified saves; concurrency safety; idempotent retries; stable IDs and permanent audit trail; minimal server round trips; no expensive SPIRITS production engines on inventory requests.

**Performance goals (aspirational, not measured):** initial interface ~2 sec, product lookup ~1 sec, save ~2 sec, history ~3 sec. Test on real phones/network before accepting.

## 2. Delivery phases

**Phase 1 — Inventory Entry (current):** finalize employee entry screens, design/manage the location master, implement fast reference lookups, design safe transaction persistence, and test across devices.

**Phase 2 — Reconciliation (deferred):** compare Blue and Green counts, resolve discrepancies (third team), compare approved totals with WS official quantities, considering WS snapshot timestamps. The specific Phase 2 screen has **not** yet been approved.

## 3. Data boundaries

| Source | Dataset | Intended use |
|---|---|---|
| SPIRITS/V4 | Finished Goods | Product IDs/names and enriched brand/subtype/other relationships |
| SPIRITS/V4 | Raw Materials | Products and V4 enrichment such as subtype and packaging classification |
| SPIRITS/V4 | Warehouses | **Only active warehouses**, since WS does not supply active/inactive state |
| New Inventory App | Locations | Warehouse→Bay→Location hierarchy and barcode mapping |
| New Inventory App | Counts and History | Teams, users, timestamps, product/location, quantities, UOM, notes, statuses, parent submission and record IDs |
| WS | Finished Goods / Raw Materials official quantity snapshots | Reference for reconciliation; never automatically overwrite physical counts |

SPIRITS supplies the shared reference/master data, not the whole V4 backend. Inventory owns its operational tables. Actual field names, IDs, links, sync approach, storage design and precise WS snapshot source **remain unverified**.

## 4. Confirmed Phase 1 employee workflow

1. Select **Blue Team** or **Green Team** (replaces UI labels 1st/2nd Count).
2. **Scan location barcode**; if unavailable, manually select **active Warehouse → Bay → Location** via dependent dropdowns. Locations belong to the new app.
3. **Scan item barcode** and look up identity/name/class in enriched master data; or select **manual** → **Packaging** or **Finished Goods** → relevant dependent dropdowns.
4. May mark **Location Empty** or **Item Not Counted**. Item Not Counted indicates present items *outside the inventory scope*, and is distinct from empty/zero counted quantities.
5. For Finished Goods, enter **case and bottle quantities together** in one submission, including full pallets, partial pallets and loose bottles.
6. **Multiplier defaults to 1**. Case qty C × full pallet count N generates **N distinct case records**, each with qty C; not one aggregate record. Partial pallet is its own case record. Loose bottle quantity creates one separate bottle record (no multiplier). Example: 5 × 100 cases + 1 × 50 cases + 4 loose bottles → **7 records**, **550 cases + 4 bottles**. Child record IDs unique; all related by common submission ID.
7. Optional **Notes**.
8. Two actions: **Submit & Stay in Location** and **Submit & Change Location**. Do not reset fields or show success before a verified save.

Legacy screenshot: desktop modal with left-hand form and image panel on right, team selection, location dropdowns, scan/manual, item name/class, qty/UOM, notes, two submission buttons. This serves as a functional reference; mobile/desktop visuals still require user approval. Product imagery was present in old UI but **not reconfirmed** for new app.

## 5. Quantity/transaction semantics and examples

- Default pallet multiplier **1**.
- 1 × 100 case count → one record of 100 cases.
- 5 × 100 → five distinct records, each 100 cases.
- 1 partial pallet × 50 cases → one more 50-case record.
- 4 loose bottles → one 4-bottle record.
- Combined example gives seven entries total, with unique IDs and one submission/family ID.
- Cases and bottles stay separate UOMs. Converting cases to equivalent bottles later requires the accurate pack size per Finished Good.
- Several partial pallets with different quantities were **suggested, not approved**.
- Direct case entry without pallets was **suggested, not answered**.
- **Proposed engineering safeguard, not yet approved:** server-side validation, idempotency tokens, serialized/atomic batch writes where feasible, verified acknowledgment and audit-only corrections.

## 6. Legacy code reference (not to copy blindly)

User shared three pasted source files plus screenshot in the previous conversation:

- `Pasted text(8).txt`: Apps Script backend with `submitData`, `buildItemMap`, `getValidationLists`, `LockService`, `Inventory Log` writes and Case/Bottle family IDs.
- `Pasted text (2)(1).txt`: `ModalEntry` HTML/CSS/client logic, dropdowns, scan/manual modes, team colors, image display and submit buttons.
- `Pasted text (3).txt`: manual/automatic repair engine `repairSpecificEntryByID` / `autoRepairIncompleteInventory`, used to reconstruct missing child rows and verify a family.
- `image(20261115-202948).png`: prior Inventory Data Entry modal screenshot.

These are conversation uploads, **not** part of this repository. Original `Fixed Data` mapped warehouse/bay/location and item ID/name/class/images. The replacement should consume the enriched SPIRITS master data plus a new location master, not assume legacy `Fixed Data` is authoritative.

Legacy risks to investigate rather than assert as fully diagnosed: repeated spreadsheet reads, partially completed multi-record operations, row-number-dependent edits, lost retry context and inefficient lookup. `LockService` alone does not guarantee complete transactional behavior.

## 7. Open decisions — do not invent

- Final mobile/desktop layout and whether to display item images.
- Location/product barcode formats, camera/scanner behavior.
- Location master fields, stable location identifiers, global uniqueness.
- Raw materials/packaging categories and supported UOMs.
- Direct standalone case entry versus pallet entry; multiple partial pallets.
- EMPTY and NO COUNT interactions with already-counted products at a location.
- Authentication, team switching, corrections and permissions.
- Network retry/offline requirements, storage and concurrency model.
- Data refresh/cache invalidation and WS source mapping.
- Exact Phase 2 reconciliation interface and matching rules.

## 8. Project controls / continuation contract

- `docs/PROJECT_HANDBOOK.md`: requirements, architecture, decisions and open questions.
- `docs/PROGRESS_LOG.md`: every major session — changes, verified tests, commits, deployments, next actions.
- `docs/NEXT_LUCY_HANDOFF.md`: precise stopping point; update before ending each session.
- Use `main` unless user requests otherwise; keep inventory separate from SPIRITS.
- Record only verified GitHub commit SHAs, deployment IDs and actual benchmark results.
- Do **not** start implementation until user finishes explaining and approves the screen layout.

## 9. Confirmed data-source clarification (2026-11-15)

The **Packaging** and **Finished Goods** product databases are the same existing databases used in SPIRITS. Do not build duplicate product master tables for Inventory. Use SPIRITS's existing Raw Materials/Packaging definitions and Finished Goods definitions; verify the exact physical schema and relationships before implementation. **Locations is a new Inventory-owned table and does not yet exist.** The active warehouse master also comes from SPIRITS.

### Location table — draft, not approved schema

Proposed fields: stable Location ID, SPIRITS Warehouse ID, Bay, Location label, scan barcode, Active/Inactive status. Warehouse → Bay → Location dependent selectors, or direct location scan. Confirm barcode uniqueness, location naming conventions, whether bay is its own table, and warehouse key fields before creating anything. Example values are illustrative only.

## 10. Existing barcode infrastructure (confirmed 2026-11-15)

Physical locations already have an established naming convention and printed barcodes. Preserve existing labels and identifiers; do not generate replacement location codes by default. Current scanning conventions: **Dry Goods/Packaging use 2D barcodes; Finished Goods use QR codes**. The user may migrate all scanning to QR in the future. The Inventory scanning and lookup design must accept both formats, store decoded identifier values independently of symbology, and allow a future QR transition without rekeying products or locations. Clarify whether the stated formats refer to product labels, location labels, or both, and inspect sample codes before finalizing scanner and schema. No table has been created yet.

## 11. Barcode uniqueness confirmed (2026-11-15)

User confirms **everything has a unique barcode**. This includes inventory products and physical warehouse locations in the intended workflow. Preserve and look up existing unique barcode values; do not create new barcode conventions. Scanning a location should resolve its warehouse, bay and location; scanning an item should resolve its existing SPIRITS product. Maintain stable internal record IDs independently of printed barcode values to protect history if labels change. Support both currently used 2D and QR symbologies and potential migration to QR. Exact barcode payload examples and location import source still need verification.

## 12. Warehouse Inventory Progress Map (2026-11-15)

**New confirmed feature:** In addition to the new Locations master table, build a **visual warehouse inventory progress map** resembling the user's existing physical layout image of **PULASKI BAY 1** (lanes and individually named rack positions). Use existing physical position labels and location barcodes; do not reduce this to a generic table. Each mapped cell links to a location record. The map is operational, showing count progress.

**User-defined map status legend:**
- **Uncolored / neutral:** neither team has started inventory at the location.
- **Yellow:** one team has started counting at the location.
- **Red:** Team Blue vs Team Green counts for the location do not match.
- **Green:** both teams' counts match **100%**.

**Recommended, not yet approved:** show map-wide progress totals; click/tap a location to see item-level details and discrepancies; add a **Finish Location** confirmation so that comparisons occur only after each team has completed the location. Otherwise one team's partial submission could misleadingly appear mismatched. Compare quantities grouped by product and normalized unit (cases/bottles), not count of child pallet rows. Consider explicit treatment for Location Empty / Item Not Counted. The exact completion workflow, reconciliation algorithm, map storage format and rendering approach are pending design approval.

**Image reference:** user provided a screenshot of a PULASKI BAY 1 plan with lane labels (e.g. PE–PX) and detailed rack locations (e.g. PRB-C6-L1). Image is a reference for physical arrangement, not a machine-readable map dataset. Need the underlying spreadsheet/drawing or location coordinates to reproduce it accurately.

## 13. No Finish Location action — confirmed (2026-11-15)

**User explicitly rejected a Finish Location button or formal completion status.** This is a small team; employees verbally report when they finish, and the supervisor then reviews the map for mismatches. Counts are submitted normally; map status derives automatically from currently recorded team counts. Neutral/uncolored: neither team has submitted; yellow: exactly one team has submitted; red: both have submitted and item/quantity totals differ; green: both have submitted and item/quantity totals match 100%. Red while work is ongoing is a **provisional live mismatch**, not necessarily a final discrepancy. Later submissions can change the map color. Do not implement or recommend a required Finish Location action unless user revisits the decision. No formal completion flag is required for Phase 1.

## 14. Verified legacy spreadsheet sources and Location Management (2026-11-15)

**Source spreadsheet:** https://docs.google.com/spreadsheets/d/13TdeoVaNFGD8E-eEREhuW1QBhzg1QtDFSWkeKQXs5rQ/edit

Connector inspection verified these tabs and IDs: `Fixed Data` (207904072), `Lynnville Map` (1789587392), `Pulaski map` (1425487219). `Fixed Data!A1:C` headers are exactly `Location | Warehouse | Bay`; example `PRA-C1-L1 | Pulaski | Bay 1`. Both maps contain physical-layout cell labels and location/status listings in their right-hand columns. Example Pulaski map has `PRB-C6-L1`; Lynnville map has `LRA-C1-L1`. These are **verified existing source data**, not new Inventory tables. Do not modify the legacy source workbook during migration.

**Confirmed new feature: Location Management module** within Inventory: create locations, edit locations, mark Active/Inactive. Link each location to active SPIRITS warehouse and bay; active locations appear in new count selections/map; inactive ones remain in historical counts. Support existing barcode as lookup key, and internal stable location ID. Use `Fixed Data!A:C` as import source and map tabs as layout references. The existing three columns do not by themselves prove that barcode values, stable IDs or Active flags are stored there; those require verification or new fields.

**Design proposal, not yet approved:** list/filter by warehouse/bay, add/edit form with Location name, existing barcode, status, and audit fields; validate uniqueness; preserve history on deactivation; map positioning/coordinates in separate mapping configuration. Map and location master should not be coupled to spreadsheet cell coordinates as permanent identifiers. No import, new database or module code has been created yet.

## 15. Entry record structure and temporary location lock (2026-11-15)

User shared the current **20-column Inventory Log** schema in order: `Count`, `Location`, `Warehouse`, `Bay`, `Item Name`, `Item ID`, `Qty`, `UOM`, `Class of material`, `User`, `Timestamp`, `Uniquekey`, `Notes`, `App_Internal_ID`, `Extra_Bottle_Qty`, `Entry_Method`, `Change_Location_Next`, `No Count`, `Multiplier`, `Script Finished`. This is **legacy reference schema**, not an approved new schema.

**Confirmed semantics:** `Uniquekey` is a comparison/grouping key constructed from location + item + UOM to compare teams; `App_Internal_ID` identifies an individual entry. Preserve this conceptual separation. **Proposed improvement:** comparison key based on stable LocationID + ItemID + UOM, scoped to inventory session (and compare team totals separately); individual UUID for every physical row; common SubmissionID for all child rows generated by one submit; InventorySessionID for one count event. Compare sums by key, not count of pallet rows. Exact key formatting, session model and final schema await approval.

**Confirmed UI behavior:** employees counting multiple items at one location can **temporarily lock the location selection** in the entry form, avoiding repeated scans/selections (e.g. ten products at location X). On submit, clear item/quantity fields but retain the selected location while locked. When done, release the UI lock and select the next location. This is **UI selection persistence**, not a concurrency/database lock and must not block another employee. Confirm whether the two existing submit actions (Stay/Change Location) remain alongside the lock toggle or should be consolidated.

**Proposed, not yet approved:** replace legacy `Script Finished` repair flag with explicit persisted/verified submission state, idempotency and error handling. Do not treat proposals as confirmed schema changes.

## 16. Approved submit UI and parent-child entry IDs (2026-11-15)

**Confirmed UI change:** replace the two legacy submission buttons with **one Submit button** plus a separate **Lock/Unlock Location** control. When locked, successful submits keep warehouse/bay/location selected and reset product/quantity fields; unlock to change locations. UI lock is local selection persistence, never a concurrency lock.

**Confirmed existing App_Internal_ID pattern:** system generates a unique **parent submission ID** and multiple generated rows receive child suffixes, e.g. `55dsgh`, `55dsgh-A`, `55dsgh-B`, `55dsgh-C` as needed. Preserve parent-child traceability. **Recommended representation (pending explicit implementation approval):** keep parent ID as submission metadata, not an extra counted inventory row, and give every count child an unambiguous suffixed ID, e.g. `55dsgh-A` through `55dsgh-G` for the seven-entry pallet example. Each child stores `ParentSubmissionID=55dsgh`; `App_Internal_ID` remains unique per record; `Uniquekey` remains the independent location/item/UOM comparison key. If the user expects the first physical row itself to be unsuffixed `55dsgh`, confirm before implementation. Ensure suffix generation works beyond 26 child rows, retries are idempotent, and the parent family is validated as a whole.

## 17. Editing and deleting inventory entries — design proposal (2026-11-15)

User described two possible approaches: (1) move deleted/edited entries to a separate archive tab and insert corrected records, or (2) retain entries in place with a `Valid` flag, invalidate superseded/deleted records and create corrected records. **Assistant recommends approach 2**, plus an append-only audit log; **await user confirmation** before treating this as a finalized design.

Proposed rules: never physically delete count history; an edit marks old record `Valid=FALSE` and creates new record with a new unique `App_Internal_ID`, linked through `Replaces_Entry_ID`; deletion invalidates without replacement. Only valid entries contribute to totals, comparison keys, and map statuses. Record `Modified_By`, `Modified_At`, and optional `Correction_Reason`; preserve old values. A separate append-only audit event log records edit/delete and linked IDs. For multi-child pallet submissions, support editing one child versus replacing the whole parent family explicitly; prevent partial family invalidation/recreation on failures through validated, idempotent write operations. Keep `Uniquekey` distinct from per-row ID. Note: Google Sheets lacks full ACID transactions, so design recovery/retry semantics carefully. User approval pending.

## 18. Edit scope restricted to original submitted records (2026-11-15)

**User-confirmed:** An edit may correct **only records already present in the original submission**. Example: submission contains five 100-case pallets; edit screen may change the quantities of those same five pallet records, but **cannot add loose bottles, a sixth pallet, or any other new child record through Edit**. Adding additional inventory must happen through the separate New Entry flow. Preserve original record count and record types/units during edit. This limits the prior proposal to 'edit one child' or 'correct existing family'; **do not offer replace-family workflows that add/remove child rows**. If implementing invalidate-and-replace versioning, replacements are one-to-one for corrected existing children and retain original parent/submission linkage and audit history. Deletion remains a separate action (authorization/record-scope TBD). The previous question about who is allowed to edit (own entries vs same team) was **not answered** by this clarification; ask separately later if needed. The proposed Valid-flag/audit-log architecture still awaits explicit confirmation.

## 19. Blind inventory: strict per-user visibility and editing (2026-11-15)

**User-confirmed:** This is a **blind inventory**. In the employee UX, show **only entries personally submitted by the authenticated user**. An employee can edit or delete **only their own entries**, not another user's entries even if they belong to the same team. Do not show the employee another employee's records, counts, Blue/Green comparisons, matched/mismatched quantities, or supervisor reconciliation results. This overrides any prior implication that team-wide entries may be visible.

**Required security implementation:** enforce ownership and role-based access **server-side on every list/get/edit/delete and aggregate endpoint**, not only via hidden UI. Use authenticated identity bound to entry's immutable creator identity; do not trust a client-supplied User field or user ID. Keep supervisor map/discrepancy/reconciliation access behind a distinct authorized role. Employee location selection and scanning must not leak whether other employees counted a location. Existing edit-scope rule still applies: can correct only existing child records, no new pallets/bottles via Edit. Exact supervisor/admin permissions and user authentication method to validate before implementation.

## 20. Google Workspace authentication and group domains (2026-11-15)

**User-confirmed:** Inventory users authenticate with Google Workspace identities from `@bsb.com`, `@bigmachinedistillery.com`, and **other group domains** (not a fixed two-domain allowlist). No separate Inventory password system requested. Blind-inventory ownership must bind to the verified signed-in Google account, never a client-entered User value. **Proposed admin design:** configurable Authorized Domains plus authorized individual users and Blue/Green/supervisor role assignments; domain alone should not automatically grant entry access. Verify exact permitted additional domains and group membership/approval process later.

**Critical implementation gate:** before relying on Google Apps Script identity, test the actual deployment mode and account types to confirm server-side caller email/identity is reliably available and nonblank. Avoid treating `Session.getActiveUser().getEmail()` as universally available; deployment execution identity and cross-domain access can affect behavior. If GAS cannot reliably identify all authorized users, choose a secure verified authentication mechanism rather than weakening ownership checks. No auth implementation yet.

## 21. Access grant vs. team selection (2026-11-15)

**User-confirmed correction:** Administrators **only grant or revoke access to the Inventory App**; they do **not** assign users permanently to Team A or Team B. Once authorized, a user can choose **either Team A or Team B** when counting. This supersedes the prior proposal for admin-assigned Blue/Green team memberships; Team A/B correspond to the two independent counting teams (previously called Blue/Green). Persist chosen team on each entry and maintain blind inventory: user may view/edit/delete only personally created entries regardless of team. Supervisor access to map/reconciliation remains a separate authorization/role concern, to be designed. **Proposed, not yet user-approved:** lock team selection for the current count session to avoid accidental switches; permit changing it at start of a new session. Verify whether switching teams should be restricted during a particular inventory event, to protect independent counts.

## 22. Phase 1 boundary and independently lockable team selection (2026-11-15)

**User-confirmed Phase 1 objective:** obtain accurate, independent inventory counts from **Team A and Team B**. **Whiskey Systems (WS) reconciliation is Phase 2**, not a Phase 1 requirement. Phase 1 can include employee count entry, correction/deletion rules, blind access, and supervisor comparison/progress map, but not WS quantity reconciliation.

**User-confirmed team behavior:** Authorized employees may switch between Team A and Team B **during the same inventory event**, but the selected team is **locked by default/after selection** and requires a deliberate **Unlock Team** action before switching; employee then relocks the chosen team. Team selection lock is a **UI control**, not a permanent admin team assignment or server-side prohibition on switching. Persist the actual selected team on every submitted entry, immutable for that record; team and location locks operate independently. Do not silently reassign earlier entries when team selection changes. **Recommended safety guard (not yet expressly approved):** prompt before switching teams if an unsaved form is present; ensure team is locked before accepting Submit. A user can have own entries in both teams while remaining blind to everyone else's counts.

## 23. Voice recognition for inventory entry — requested Phase 1 feature (2026-11-15)

**User-requested new feature:** voice recognition to select a warehouse location and/or enter a complete inventory count. Example utterance: `Location PRA-L1-C4 5 pallets Pickers 1lt with 100 cases each`. Desired interpretation: location `PRA-L1-C4`, product `Pickers 1L`, multiplier 5, 100 cases per pallet; generates **five separate 100-case child records** under one parent submission, totaling 500 cases, if location and product resolve to valid masters. This is a **requested capability, not implemented**.

**Recommended safe UX:** tap-to-speak microphone button in Phase 1 entry form; speech-to-text parses fields, resolves location/product against existing master data, displays structured preview and requires user confirmation before Submit. Never silently save speech output. If location/product ambiguous, unknown or low confidence, require explicit correction/selection; do not invent IDs. Respect selected Team A/B and location lock; avoid silently overriding locked location without user action. Support partial commands such as selecting location only, and commands without location when a location is locked. Voice entry uses the same validated server-side persistence, parent-child IDs, ownership restrictions, and audit semantics as barcode/manual entry. Test browser/device microphone permission, browser speech recognition support and noisy warehouse environment before choosing on-device/browser vs other transcription service. Treat audio/transcripts as sensitive; do not store raw audio by default. The precise spoken location example may differ from existing location naming (`PRA-C1-L1` etc), so validate against actual data rather than assume it exists.

## 24. Two separate voice-entry modes (2026-11-15)

**User-confirmed design refinement:** Voice controls are **separate by field/context**, not one always-on generic dictation mode.

1. **Location microphone**: when activated on the Location field, accept **only a location value**, resolve against the actual location master, and fill its Warehouse/Bay/Location. Do not parse or save product counts from this mode. Require valid exact match or explicit disambiguation.
2. **Product/count microphone**: when activated on the product entry area, parse product, quantities, UOM and pallet breakdown, while using the **currently selected location**. User's example: `3 pallets Pickers Original 1lt 100 cases each 1 partial pallet 20 cases keep location`. Expected interpretation: product Pickers Original 1L (resolve against catalog), 3 full pallets x 100 cases plus 1 partial pallet x 20 cases, total **320 cases**, **four separate counted child rows** (100,100,100,20), one parent submission. The `keep location` command retains the current location for the next entry. Must not silently change location or team; retain existing independent location/team lock semantics. Validate product and amounts, show structured preview, require confirmation before save; same ownership and audit rules as manual/barcode entry.

Implementation remains pending. Clarify later whether `keep location` is an explicit spoken override for an unlocked location or simply an alias to lock/retain location, and how to handle voice commands containing unsupported fields.

## 25. Voice command: change/new location after successful count submission (2026-11-15)

**User-confirmed example:** `5 pallets Pickers Original 1lt 100 cases each 1 partial pallet 20 cases new location (or change location)`. Parse product `Pickers Original 1L` against master, five full pallets x 100 cases and one partial pallet x 20 cases, yielding **six separate counted child records**, total **520 cases** at the **currently selected location**. Both `new location` and `change location` are equivalent voice instructions for the **post-save next-entry action**, not a new location identifier and not a request to change the location of the current count. After **verified successful, confirmed** submission, unlock/clear location so employee can scan/speak/select next location. If save fails or is canceled, preserve current location and entry. Contrasts with `keep location`, which retains selected location for subsequent entries. Keep team unchanged and respect blind ownership. This is documented UX behavior; no implementation yet.

## 26. Voice recognition: spoken product names differ from catalog labels (2026-11-15)

**User-identified key challenge:** Catalog may name an item `Borchetta Bourbon #473 2025 750mL/6pk`, while a user says `Borchetta Bourbon Racecar 2025 473 20 cases`. The app should recognize that the speech may refer to the same existing SKU and extract quantity 20 cases, despite added nickname (`Racecar`), reordered tokens, and omitted packaging. **Do not assume this example is an actual verified catalog SKU or that the match is unique.** Resolve against SPIRITS master product IDs and available packaging variants before presenting a result.

**Recommended product resolution design:** (1) exact normalized official name, barcode, and explicitly approved voice aliases; (2) token/attribute matching on brand, product/release number, vintage/year, volume and pack size; (3) ranked candidate suggestions with explicit employee selection when ambiguous. Separate count quantity tokens (e.g. `20 cases`) from product identifier tokens. Alias mappings should be stored as product-ID-linked metadata, not duplicate product masters; require administrator approval for aliases to avoid crowd-sourced incorrect SKU matches. For omitted 750mL/6pk, only autofill from catalog when the remaining attributes uniquely identify one SKU; otherwise ask for size/pack. Never automatically submit a low-confidence or ambiguous match. Display official SKU and quantity for confirmation before saving. This is a design proposal responding to user concern, not implemented or benchmarked.

## 27. Mandatory review and explicit Save/Cancel for voice counts (2026-11-15)

**User-confirmed:** Before any voice-recognized inventory entry is submitted, the employee **must see on screen what they said** and have explicit **Save** and **Cancel** actions. Voice input must **never auto-submit**. Review should show both the recognized transcript and its parsed/resolved fields (official catalog product, location, quantity/UOM, pallet breakdown, team, and next-location instruction when relevant), so employee can detect transcription or matching mistakes. **Save** validates and persists the entry with existing verified-save/idempotent parent-child behavior; **Cancel** discards the unsaved recognized entry and writes nothing. Allow correction before Save as a recommended UX detail. Do not advance/change location on a `new location` voice instruction until Save succeeds. This explicit confirmation rule supersedes earlier open questions about automatic submission or spoken `Submit`.

## 28. Hard speed requirement: under 4 seconds (2026-11-15)

**User-confirmed benchmark:** Existing AppSheet/legacy script inventory entry takes **less than 4 seconds**. New Inventory Web App Phase 1 must complete the comparable entry workflow in **under 4 seconds**, including voice-assisted workflow as a key priority. Treat this as an acceptance criterion, not an achieved result. Mandatory employee voice review and explicit Save/Cancel remain non-negotiable; human speech duration and review/decision time cannot be guaranteed under a software latency SLA, so instrument separately: (a) speech-ended to parsed preview ready, (b) preview display to employee Save click, (c) Save click to server-verified confirmation, (d) overall elapsed. Proposed engineering budgets (not validated): location lookup <0.5s, product lookup <0.5s, speech transcription/interpretation <2s, save <2s; budgets may overlap and should not be summed as a guarantee. Aim <4s for system-controlled latency after speech ends and quick confirmation; clarify exact benchmark if necessary. Preload/cache masters, resolve product/location efficiently, batch child pallet rows into a single idempotent save request, minimize Apps Script roundtrips, instrument all phases on representative phones and warehouse connectivity, and never trade correctness or blind-inventory security for speed.

## 29. Admin module for Team A/B discrepancies — reference screenshot (2026-11-15)

User supplied screenshot of current spreadsheet comparison tab and requests discussion of an **Inventory Administration** module for monitoring differences between two blind inventory counts. Visible columns: `Location`, `Item Name`, `UOM`, `Warehouse`, `Bay 1` (bay), `Count 1`, `Count 2`, `Match`, `Helper Column`. Sample displayed rows include matching 11 vs 11 cases of Borchetta Bourbon #473 at PRA-C1-L4; the screenshot's visible rows mostly show matching counts. **Do not claim example mismatches from screenshot.** Proposed supervisor-only live comparison dashboard with count progress, matched/mismatched/pending summary, filtering by warehouse/bay/location/product and discrepancy drilldown. Keep this separate from employee blind-entry UX.

**Proposed comparison key:** InventoryEventID + stable LocationID + ProductID + UOM; aggregate **valid** child records per Team A and Team B. Compare only when both teams have explicit count submissions; missing team submission = **Pending**, not zero. Distinguish explicit no-count/empty-location from numeric zero and ensure matching logic follows user-defined semantics. Show Match if normalized totals equal, Mismatch if totals differ, Pending if second team absent. The existing 4-state map can derive location-level status from these row comparisons, but clarify treatment of incomplete counts before implementation. This is **Phase 1 internal team comparison**, not Phase 2 Whiskey Systems reconciliation. No admin UI or comparison engine implemented yet.

## 30. Existing reconciliation sheet is already live and formula-driven (2026-11-15)

**User correction:** The existing Team A/Team B comparison sheet is **already live**, powered by `ARRAYFORMULA`, `VLOOKUP`, `QUERY`, `MAP` and other formulas. Do **not** describe it as manual/static or imply that simply making it live is an improvement. Before designing or replacing the comparison engine, inspect the actual spreadsheet formulas and their dependencies, preserve verified comparison semantics (including helper columns, no-count handling, missing team entries, UOM, and duplicate child aggregation), and establish performance/accuracy parity. Proposed future implementation may use a backend comparison engine and an admin UI, but that is not yet approved or built; avoid prematurely replacing working formulas without audit and benchmark. User is discussing architecture, not requesting code now.

## 31. Admin discrepancy workflow discovery comes before redesign (2026-11-15)

**User direction:** They are **explaining the existing logic for how discrepancies are handled**; do not jump into implementation, prematurely choose Sheets vs backend, or assume the existing formulas need replacement. User **wants to revisit and inspect the existing formulas** (ARRAYFORMULA, VLOOKUP, QUERY, MAP, etc.) to determine whether a better approach exists **after** understanding current behavior. Workflow: listen to user description, inspect actual formulas and dependencies, document verified comparison/exception/handling rules, evaluate alternative implementations for correctness and performance, then jointly design Admin module. Existing sheet is live. Avoid unapproved design assumptions and premature follow-up choices while user is still explaining.

## 32. Clickable location map: admin side-by-side aggregated team totals (2026-11-15)

**User-confirmed:** In the supervisor/admin warehouse map, clicking a location should open details explaining **why it has its current color**. For a **red** location, display Team A and Team B's counts **side by side as global/aggregated totals**, not individual employee submissions or per-entry rows. Example: Team A counted **100**, Team B counted **99**, regardless of the number of individual entries used to reach those totals. Compare per location + stable product ID + UOM (and inventory event) by summing valid child records for each team. Show the product(s) responsible for the red discrepancy and numeric difference; other matching products may also appear. The map is admin-only; blind employee UX must never expose opposite-team counts.

Existing location color convention: neutral = neither team counted; yellow = only one team has submitted; red = both teams counted but at least one product/UOM total differs; green = both teams' totals match 100%. Location details should explain status and allow aggregated product-level inspection. Do not equate record counts with physical quantities. If either team has not yet counted a specific product, preserve distinction between missing submission and explicit zero/no-count; refine incomplete-location handling with user before finalizing algorithm. Example dashboard numbers are illustrative, not extracted from current spreadsheet. No implementation yet.

## 33. Confirmed dynamic location map status as Team B starts (2026-11-15)

**User-confirmed exact semantics:** All discrepancies are **red**. If Team A scans/counts five items in a location while Team B has not counted there, the location is **yellow**. **As soon as Team B starts submitting counts at the same location**, evaluate the team totals; if they do not yet match, turn the location **red immediately**, even if Team B is still in progress. As additional counts are submitted, automatically recalculate. When all product/UOM aggregate totals for Team A and B match, turn **green**; if any difference remains, stay **red**. Neutral when neither team has submitted. No Finish Location button or completion gate. Counts may later change, so green can return to red if a new/corrected entry causes mismatch. Compare **all valid entries** summed by team+product+UOM; an as-yet-unrecorded product on the other team is a discrepancy once both teams have started at the location. This supersedes prior suggestion to keep such locations pending until both teams finish. Team A/B labels are interchangeable for first-counting team.

Status algorithm for an inventory event and location: neither team has valid count presence => neutral; exactly one team has valid count presence => yellow; both have count presence and their complete normalized product/UOM aggregate maps are equal => green; both have count presence and aggregate maps differ => red. Need explicit treatment of empty/no-count markers and deleted/invalidated entries before implementation. The map and details are supervisor-only.

## 34. Separate filterable reconciliation table alongside clickable map (2026-11-15)

**User-confirmed:** Admin must have **both** (1) the clickable color-coded warehouse map with aggregated per-location team comparisons and (2) a **separate reconciliation table module**, modeled on their existing live comparison spreadsheet screenshot. The table must support combined **filters by location, item/product, and match status** (matched vs discrepancy, with pending/one-team cases as appropriate). Preserve useful spreadsheet columns: Location, Item Name, UOM, Warehouse, Bay, Team A Count, Team B Count, Match; helper column behavior should be inspected from actual formulas before deciding whether to expose it. Display team-level **aggregate quantities per event/location/product/UOM**, not individual entry counts. Both map and table must derive from the same comparison results so statuses agree. Additional warehouse/bay filters, sorting, clear filters and export are possible UX enhancements, not yet individually approved. Admin-only, respecting blind inventory. No code yet.

## 35. Identifier proposal for Finished Goods versus Dry Goods (2026-11-15)

User asks: Dry Goods use Item ID; what should Finished Goods use? **Assistant recommendation, pending verification/approval:** use the **existing stable Finished Goods Product ID from SPIRITS** (not product display name or a new identifier). Dry Goods/Packaging use existing Item ID. Reconciliation should group by InventoryEventID + LocationID + category-specific stable product identifier + UOM, with Team A/B totals separately compared. Distinct FG release/size/pack configurations must remain distinct products. **Verify exact Finished Goods master ID field and its uniqueness/stability in actual SPIRITS data before implementation; do not assume field name or schema.**

## 36. Verified SPIRITS Finished Goods IDs in actual database (2026-11-15)

**Verified via connected Google Sheets** in live `BMD V4 — Database` spreadsheet ID `1fll-r__z9DWWehswc-eaOyYMuO2zdFoWzksNqAtIZj8` (SPIRITS legacy database name): `Products!A1:I` header is `ProductID | BrandID | ProductName | SizeML | UnitsPerCase | TargetProof | Status | CreatedAt | UpdatedAt`. ProductID is populated with UUID-like stable IDs, e.g. `c6c316bc-1f10-4448-ab38-7c5f50cc4d96` for `Pickers Blood Orange Vodka 100mL/24pk`, and `182df808-f768-4041-a1b4-5408ff68f821` for `Pickers Blood Orange Vodka 1L/12pk 70PF`.

`Releases!A1:M` header is `ReleaseID | FamilyID | WSProductName | WSMasterID | SizeML | UnitsPerCase | Proof | Status | CreatedAt | UpdatedAt | ProductID | ReleaseName | ReleaseType`. Sample Releases rows contain ReleaseID, WSMasterID and ProductID linking to Products. Thus the earlier suspicion that Finished Goods lacked IDs is **disproved for the SPIRITS master**. Recommended Inventory App FK: existing Products.ProductID for finished goods, existing dry goods Item ID for materials. **Important pending design check:** determine whether counting/reconciling at release granularity requires Releases.ReleaseID rather than Products.ProductID when multiple releases map to one product; verify uniqueness and mappings across all rows, not just header/sample. Do not confuse SPIRITS internal ProductID with WS Master ID. No data was changed.

## 37. Finished Goods must also carry Whiskey Systems identifier (2026-11-15)

**User-confirmed requirement:** Alongside SPIRITS internal Finished Goods identifiers, Inventory App must bring in the **WS Finished Goods ID** for each counted FG SKU, so later reconciliation with official Whiskey Systems records is possible. Existing SPIRITS `Releases` table has `WSMasterID` (column D), `ReleaseID` (A), `ProductID` (K). **Verify that `WSMasterID` is the WS Finished Goods ID the user means** and that its release-level mapping is complete and unique before implementation. Do not create a redundant new WSFinishedGoodsID field if WSMasterID is verified as equivalent. Maintain both internal and external IDs. Dry Goods analog: `Materials.MaterialID` internal and `Materials.WSRawMaterialID` external. Product vs Release ID granularity still to be resolved. No implementation.

## 38. Correction: WSFinishedGoodsID is NOT confirmed to exist (2026-11-15)

User corrected assistant: their point is that the **WSFinishedGoodsID is not currently present/established**, so the Inventory App must obtain and map the actual WS Finished Goods identifier. Inspected SPIRITS `Products` and `Releases` headers contain `ProductID`, `ReleaseID`, and `WSMasterID`, but **no column literally called `WSFinishedGoodsID`** in those inspected tables. **Do not assume `Releases.WSMasterID` is the correct WS Finished Goods ID without validating against the actual WS finished-goods source.** If verified equivalent, map/reuse it; otherwise add a distinct verified WS identifier to the data model and import/link it. No database changes made. Clarify the actual WS source before implementation.

## 39. ReleaseID likely discarded legacy concept — do not design Inventory around it (2026-11-15)

**User correction:** `ReleaseID` was discussed early in SPIRITS design but later discarded; user believes it is **not used for anything**. Thus do **not** assume `ReleaseID` is an active, meaningful FG inventory identity or recommend it as the comparison key. Proposed FG internal key is `Products.ProductID` and a **separately verified actual WS Finished Goods ID**; existing `Releases.WSMasterID` has not been established equivalent to that ID. **Do not delete or repurpose ReleaseID yet:** first audit actual code, sheet references, and mappings for any remaining dependencies. Historical column existence does not prove current use. No implementation or deletion approved.

## 40. Employee-facing inventory identity: WS ID or name, never SPIRITS ID (2026-11-15)

**User-confirmed:** For Dry Goods, employees scan `WSRawMaterialID` **or search/scan the material name**, and both resolve to the **same canonical material**. Finished Goods must work identically: scan/search `WSFinishedGoodsID` **or Finished Goods name**, both resolving to the **same canonical FG SKU**. SPIRITS internal `MaterialID` and `ProductID` are **never shown to or used by employees**; they exist only behind the scenes for joins/integrity. Employee-visible inventory forms/results show WS identifier and human-readable name. The WS Finished Goods identifier is **not yet verified/mapped** in existing SPIRITS source and must be sourced and linked. Do not treat `Releases.WSMasterID` as equivalent without verification. Names/aliases can be ambiguous; only auto-resolve when unique, otherwise require explicit SKU selection. Compare team totals on canonical identity, not whether ID vs name was used for entry. No implementation yet.

## 41. Live SPIRITS cross-database duplicate audit (2026-11-15)

Read-only audit of spreadsheet `BMD V4 — Database` (`1fll-r__z9DWWehswc-eaOyYMuO2zdFoWzksNqAtIZj8`), comparing trimmed, case-insensitive names/IDs. `Material Reference` has **710** records (columns Category, Material ID, Material Name); `Releases` has **228** records (WSProductName, WSMasterID); `Products` has **231** records (ProductID, ProductName). `Materials` has only its header, no records. All 710 raw and 228 release rows have IDs/names. Findings:

- **Cross-category ID collision:** `112370`: `Material Reference` row **518**, `Flavor Mango Nat. WONF`; `Releases` row **54**, `Borchetta Bourbon #497 2023 750mL/6pk`. This means a bare scanned ID is **ambiguous** if the ID namespaces are not proven distinct. Must ask to choose Raw Materials vs Finished Goods or otherwise disambiguate; never auto-assign.
- **Raw name collision:** `ZII Box BoBo` appears twice: raw row **390** ID `116972`, row **391** ID `128834`. No duplicate raw IDs.
- **FG Releases:** no duplicate `WSMasterID` and no duplicate `WSProductName` among 228 rows. No cross-category exact-name collision against raw.
- **SPIRITS Products:** three duplicate ProductName pairs with distinct ProductIDs: `Big Machine Double Spiked Citrus Peach 4 x 200mL/8pk` rows **21/229**; `Big Machine Double Spiked Coconut Breeze 4 x 200mL/8pk` rows **22/230**; `Big Machine Double Spiked Lavender Lemonade 4 x 200mL/8pk` rows **23/231**. No duplicate ProductIDs.

**Caveat:** `Releases.WSMasterID` is still not independently verified to equal official WS Finished Goods ID. Audit compares these currently populated source columns, not an independent WS export. No data changed. Recommend canonical identity including material category and verified external ID, and prompt user for ambiguous name/ID; audit duplicate ProductIDs before any cleanup.

### 2026-11-15 — User resolved WS-side duplicates; SPIRITS duplicates remain

User reports removing WS item ID `112370` from Whiskey Systems and renaming one of the two `ZII Box BoBo` items. These are **user-reported source changes**, not yet verified in refreshed SPIRITS snapshots; old spreadsheet reference may still contain stale entries. Three duplicate names (Citrus Peach, Coconut Breeze, Lavender Lemonade 4 x 200mL/8pk) were found in SPIRITS `Products` tab, not asserted to be WS duplicates. Investigate SPIRITS ProductID references before any deletion/merge. No app/database changes made.

### 2026-11-15 — Retired older Citrus Peach duplicate in SPIRITS

User authorized removal from active list after dependency review. Inspected `BMD V4 — Database` `Products` row 21 older `Big Machine Double Spiked Citrus Peach 4 x 200mL/8pk` (`ProductID=2e50b420-0af4-4a2a-98c6-5abfb5048eeb`, 8 units/case); no direct ProductID references found in inspected Releases, priority, PAR, production, BOM, inventory sheets. Newer row 229 (`ProductID=225d8069-c53a-4a24-bd7f-20e2d50c587e`, 32 units/case, proof 25) is linked in Releases row 207 and matches subtype units/case. **Changed only `Products!G21` from Active to Inactive**, verified readback; row 229 remains Active. Historical record retained; no row deleted. Note that subtype in `BrandReleaseTypes` row 90 is itself Inactive and not changed. Other two duplicate pairs not changed. Need ensure Catalog/Inventory filters inactive Products when presenting employee options; no code changes made.

## 42. Whiskey Systems duplicate watchdog — approved requirement (2026-11-15)

User requests ongoing **watchdog** for duplicate WS IDs or names. Proposed behavior: after each successful WS snapshot/import, check raw materials and finished goods separately for duplicate WS IDs and normalized names; check cross-category ID and name collisions; log conflict type, involved source records and rows, first/last seen, resolved state; show unresolved conflicts in SPIRITS notification bell; deduplicate repeat alerts; auto-clear only when a later successfully refreshed snapshot confirms resolution; never auto-delete or merge. Inventory App must not auto-resolve an ambiguous scan/name: require category/record selection. Normalize case/whitespace but preserve original values for display. Compare only authoritative WS snapshot fields; avoid treating SPIRITS-only Products duplicate names as WS-origin conflicts. **Implementation pending:** determine actual source feeds and snapshot completion hook, verified WS FG ID field, existing notification mechanism and exact cross-category namespace policy. No watchdog code deployed yet.

### 2026-11-15 — SPIRITS duplicate watchdog reported implemented

User confirms **SPIRITS Lucy already set up the duplicate-item notification alarm** in SPIRITS. Therefore Inventory App must **not implement a second duplicate watchdog**; SPIRITS is responsible for ongoing WS duplicate detection and bell notifications. Inventory consumes the curated SPIRITS product data for monthly counts. Keep a lightweight ambiguity safeguard at the scan/name selection boundary: if multiple candidate records still match, prompt for explicit selection, never guess. This is user-reported implementation status; no independent deployment verification performed here.

### 2026-11-15 — Phase 2 reconciliation workflow (user confirmed)

Once independent Team A and Team B counts match and the Phase 1 comparison is **all green**, treat their agreed physical inventory as the **official physical numbers** for Phase 2 comparison against Whiskey Systems (WS). Phase 2 compares official verified physical quantity against WS quantity; show matching items and discrepancies, with variance = physical minus WS. Proposed implementation safeguard: capture an immutable verified snapshot for audit before reconciliation, preserving both teams' original submissions and the WS comparison snapshot separately. Exact WS comparison granularity, cut-off timing and approval/locking workflow are still to be decided with user. No Phase 2 code implemented yet.

### 2026-11-15 — Phase 2 global reconciliation and dated freeze (confirmed)

User confirms: when Phase 1 Team A/Team B is entirely green, **freeze the official physical inventory for that inventory day**. Preserve immutable date-specific totals and original location-level count details for audit. **WS has no location granularity**; Phase 2 must aggregate physical counts across all locations to **global totals per canonical WS product ID and compatible UOM**, then compare with WS **global** inventory. Variance = physical minus WS; surface zero and nonzero variances and missing items from either side. Do **not** use warehouse/location as a WS reconciliation dimension. Proposed safeguard (not yet explicitly approved): capture a matching-cutoff WS snapshot so subsequent WS changes cannot distort that day's reconciliation. Pending detail: how to establish common cutoff time and WS snapshot version; no implementation yet.

### 2026-11-15 — Official WS snapshot can be manually replaced for frozen inventory date (confirmed)

User confirms the **physical inventory remains frozen for its inventory day**, but the **WS comparison snapshot must be replaceable** for that same date if the original scheduled download was incomplete or incorrect. Example: 2026-11-15 WS snapshot initially taken at 4:00 AM, later manual upload replaces it as the **official WS snapshot for 2026-11-15**. Phase 2 recalculates using the replacement against the *unchanged* frozen physical counts. Proposed implementation: supervisor/admin manual upload, schema/duplicate/quantity validation, atomic promotion of successful replacement to Official, prior version retained as Superseded with uploader/timestamp, failure leaves previous official unchanged; display current official version and its timestamp. Distinguish inventory business date from WS file capture time and upload time. User has not yet specified which WS snapshot columns or file format to accept; confirm later. No code implemented yet.

### 2026-11-15 — Phase 2 finished goods case-equivalent reconciliation (confirmed)

User supplied spreadsheet screenshot and specified a compact FG reconciliation table: **WS Cases | Physical Cases | Difference** for each finished good, with product identifier/name. Both sources may include full cases and loose bottles; convert bottles into fractional cases using the canonical SPIRITS product's actual bottles/units per case. Formula `equivalentCases = fullCases + looseBottles / unitsPerCase`; e.g. 6 bottles of a 6-pack = 1 case, 5 bottles of a 6-pack = 0.833333 cases, 5 bottles of a 12-pack = 0.416667 cases. Thus 1 WS case equals 6 physically counted loose bottles for a 6-pack. Difference = physical case-equivalents minus WS case-equivalents. Display two decimal places but **compare exact quantities (prefer integer base-unit bottles)** to avoid false mismatches due to rounding. Physical totals are global across all locations and use the frozen daily inventory; WS uses the replaceable official snapshot for that date. Retain original counts by UOM and conversion audit details; no extra bottle columns in main Phase 2 comparison. Note that package naming like `4 x 200mL/8pk` may imply 32 individual bottles; use verified units-per-case configuration rather than parsing name. Pending: verify WS snapshot case/bottle source columns and treatment of special FG packaging/UOM. No code implemented yet.

### 2026-11-15 — Phase 2 reconciliation statuses (confirmed)

Finished Goods global reconciliation table now requires columns: product, WS case-equivalents, frozen physical case-equivalents, difference (physical minus WS), **Match Status** (automatic `Match` / `Mismatch` based on exact units), and **Reconciliation Status**. When matched, reconciliation status is automatically `Match`. When mismatched, authorized reviewer selects either **`Explained` or `Unexplained`**; do not change underlying quantities when selecting. Recompute match on official WS snapshot replacement and reset to `Match` if discrepancy resolves. Preserve selections with inventory date, WS snapshot version, and reviewer/audit metadata; decide later whether prior explanations should carry over after a snapshot replacement (default safer to require re-review). No code implemented yet.

### 2026-11-15 — Final WS adjustment verification: baseline + frozen physical + updated WS (confirmed)

User clarified end-of-inventory reconciliation requires **three independently preserved values** for each canonical FG item: (1) **Original Official WS Snapshot** (baseline from inventory date, potentially corrected/replaced if original download was invalid), (2) **Frozen Physical Count** (Team A/B matched, global case-equivalent quantities), and (3) **Updated WS Snapshot** manually downloaded/uploaded *after* making adjustments in Whiskey Systems. Example All Mighty Shine 140 proof 375mL/12pk: baseline WS 32 cases, frozen physical 31, after adjusting WS download shows 31 -> final Match. If updated WS still differs, clearly flag outstanding mismatch. Main final table should show original WS, frozen physical, updated WS, final difference (physical minus updated WS), and final Match/Mismatch, while retaining earlier Explained/Unexplained classification/audit record. Finalization requires every product to match exact base units (including loose bottle conversions and missing items). Allow successive updated WS snapshots without overwriting baseline or frozen physical, retaining history/version/timestamp/uploader; do not confuse a replacement of an invalid **baseline** snapshot with a post-adjustment **verification** snapshot. No code implemented yet.

### 2026-11-15 — End-of-Phase-2 inventory valuation (user confirmed)

After Phase 2 reconciliation and post-adjustment WS verification, add **cost for all inventory items**, both Finished Goods and Raw Materials. **SPIRITS is the sole authoritative source of costs; never use Whiskey Systems prices**. Calculate final inventory value = verified final quantity × SPIRITS cost in the matching UOM, converting FG cases/loose bottles correctly and raw-material UOM as needed. Suggested output columns: item, final quantity, SPIRITS unit cost, extended inventory value; subtotals and grand total. Proposed safeguard (not yet confirmed): freeze the selected SPIRITS cost/version as of the inventory date to preserve historical valuation after price edits. Pending: confirm which SPIRITS cost field/calculation to use for Finished Goods (COGS per case?) and Raw Materials (vendor official/default cost?), and handling of missing/zero costs; do not invent or pull WS cost. Design only, not implemented.

### 2026-11-15 — Correction: unit cost only, no inventory valuation multiplication

User clarified final Phase 2 table needs **only the Unit Cost field** from SPIRITS for every item. Do **not** calculate or display extended inventory value (quantity × cost), subtotals, or inventory valuation grand total. Finished Goods show SPIRITS cost per case; Raw Materials show SPIRITS cost per configured UOM. This supersedes the preceding 'Inventory Valuation' proposal. Cost source remains SPIRITS, never WS. Exact SPIRITS cost calculation/field to use remains to be confirmed.

### 2026-11-15 — Finished Goods Unit Cost source confirmed

User confirms **Finished Goods Unit Cost = Total COGS per Case already calculated in SPIRITS** (the full SPIRITS COGS calculation, not a newly derived inventory valuation). Display as a single `Unit Cost ($/Case)` field in final Phase 2 reconciliation; **do not multiply by quantities** and do not show extended inventory values. Raw Materials remain cost per configured UOM from SPIRITS. Follow the existing SPIRITS COGS calculation, including its component rules; do not independently reimplement or infer cost from WS. Confirm exact API/data retrieval during implementation.

### 2026-11-15 — FG unit cost correction: liquid + dry goods only (confirmed)

User explicitly corrected previous FG cost definition: **Finished Goods Unit Cost for Inventory = SPIRITS liquid cost + dry goods cost per case ONLY**. **Exclude labor, taxes (including FET), freight, and overhead**. Do not use SPIRITS all-in Total COGS if it contains those excluded components. Read existing SPIRITS component costs and sum only liquid and dry goods; show one `Unit Cost ($/Case)` field, no multiplication by quantities. This supersedes earlier notes saying full Total COGS per Case. Raw Materials continue to use SPIRITS cost per configured UOM. Confirm precise SPIRITS fields/API when implementing; no code change made yet.

### 2026-11-15 — Extended Report 2 additional WS categories (user confirmed)

Report 1 remains inventory reconciliation export. Report 2 is an **extended BMD-only report** containing inventory reconciliation PLUS **Blending Ingredients**, **Tanks/Bulk Spirit**, and **Barrels**. These added categories are report-only and are **not physically counted** by the Inventory App.
- Blending Ingredients: sourced from the same official WS Raw Materials snapshot but normally filtered out of physical counting; include item name, official WS quantity, and unit cost from SPIRITS COGS.
- Tanks: source `Tanks Inventory LIVE` spreadsheet `1j0V6hyNx9AtvWWK_vDdNGQbTcqh1N-lyVFXzYtJFb9o`, `PasteLiveData` gid `214586892`. Confirmed headers include `Tank Name`, `Internal Spirit Type`, `WG`, `PF`, `PG`, `Owner`; report bulk liquid name, WS PG quantity, SPIRITS COGS cost.
- Barrels: source `Barrels Inventory LIVE` spreadsheet `1MySC8PghgC1z94lqmz-yWF9m_wKFbxpMoEvttprk83A`, `PasteLiveData` gid `1682009944`. Confirmed headers include `BarrelId`, `InternalSpiritType`, `OriginalPG`, `OriginalWG`, `OwnerName`; report barrels grouped by IST with barrel count and PG plus SPIRITS COGS cost. **Must verify which field represents current barrel PG**; `OriginalPG` cannot automatically be treated as current.
- **Hard requirement: include only BMD-owned items; exclude all co-packers from every section**. Owner/OwnerName are blank in some sampled records, so do not rely on BMD name prefix alone or assume blanks are BMD. Confirm reliable ownership mapping/filter before implementation; exclude ambiguous ownership until resolved.
- All costs from SPIRITS COGS, not WS monetary `Value` fields. No extra physical counts or changes to Phase 1/2. Source inspection completed for header/schema only; implementation pending.

### 2026-11-15 — Barrel PG basis confirmed

User confirms Extended Report 2 barrels must use **original proof gallons**, not current remaining gallons. Use the source `Barrels Inventory LIVE` `PasteLiveData` column **`OriginalPG`**, aggregate `SUM(OriginalPG)` by `InternalSpiritType` (IST) and show barrel count; filter strictly to BMD-owned barrels (no co-packers). Costs sourced from SPIRITS COGS, not WS. Preserve source snapshot date and do not substitute current-volume fields.

### 2026-11-15 — Initial locations and configurable BMD ownership exclusions

User supplied initial location master with Warehouse/Bay mapping. **Pulaski Bay 1 (100 locations):** PRA C1-C6 L1-L4 (24), PRB C1-C6 L1-L4 (24), PRC C1 L1-L3 (3), PRD C1-C2 L1-L2 (4), PRE C1 L1-L4 / C2 L1-L3 / C3 L1-L4 / C4 L1-L3 (14), PRF C1-C2 L1-L3 (6), `LANE PA` through `LANE PX` (24), `Temporary Location` (1). **Lynnville (38 locations):** Bay 1: LRA C1 L1-L2, C2 L1-L4, C3 L1-L4, C4 L1-L2 (12); Bay 2: LRB C1 L1-L4 (4), LRC C1 L1-L2 (2), `LANE LA` through `LANE LJ` (10); Bay 3: `LANE LK` through `LANE LT` (10). **Total 138 locations**. Preserve original human-readable location codes and Warehouse/Bay assignments. This is a starting list, not an exhaustive future limit. Map and selectors should use a location master table.

**BMD ownership exclusion rule:** exclude records whose names contain prefix/suffix `JYP`, `OTS`, `Dios`, or `SCG`, case-insensitive, for all categories including dry goods, finished goods, blending ingredients, IST, tanks, and barrels. Build an editable `OwnershipExclusions` table so future tokens can be added without code changes. Apply to eligible inventory selection and BMD-only extended report. Clarify matching boundaries to avoid false positives in unrelated names; do not treat these text rules as proof of ownership if other explicit owner fields conflict. Keep excluded records traceable for audit. No app code implemented yet.

### 2026-11-15 — Access, hosting, and test-data decisions

User confirms Inventory Web App will be hosted with **Google Apps Script + Google Sheets**, as an **independent** app from SPIRITS. Build an administrator/counter access table (`AppUsers` proposed) keyed by Google Workspace email, with role (Administrator or Counter), active status, and existing Team A/B selection/lock rules; do not pre-populate people without user authorization. Administrator manages access. Test strategy: use isolated **copies of existing SPIRITS/WS snapshots and location/product mappings**, plus synthetic counting sessions, never write to production SPIRITS or official WS source snapshots. Remove/segregate test counts before official inventory; test source data does not require new user-supplied files yet. No implementation performed.

### 2026-11-15 — Ownership exclusion matching clarified with examples

User provided positive BMD examples: `BMD Products Borchetta Bourbon #292 2022 750mL/6pk`, `Pickers Original Vodka 1L/12pk`, `BMD BBRC 2025 Cork 750ml`, `BMD BB SingleBarrel LabelNeck 750ml`, `BMD GEN RUM - RUM (BASE)`, `BMD BB WHISKEY - SMALL BATCH (BT) (80 PF)`. Non-BMD examples: `JYP OTS Explorer002 Box 750ml`, `JYP OTS Finish Seekers 750mL/6pk 110PF`, `JYP OTS Whiskey - Bourbon 2019 (80%Corn)`, `JYP OTS Whiskey - Bourbon 2005 (84% Corn) (100-160 pf)`, `Dios Azul Anejo 750mL/6pk 80PF`.

Implement case-insensitive **whole code/word token** exclusion for configurable `JYP`, `OTS`, `Dios`, `SCG` (e.g. `OTS` separated by spaces/punctuation), **not substring matches within unrelated words**. Presence of `BMD` is not mandatory: `Pickers Original Vodka` is BMD. Exclusion applies to all item categories, ISTs, tanks, barrels, physical count eligibility, and extended report. Exact owner fields, if reliable, should be checked to avoid accidental inclusion; review ambiguous records. This clarification supersedes ambiguous 'contains prefix/suffix' wording in prior notes.

### 2026-11-15 — CRITICAL SCOPE CORRECTION: Ownership exclusions ONLY Extended Report 2

User explicitly corrects prior documentation: configurable case-insensitive whole-token exclusions (`JYP`, `OTS`, `Dios`, `SCG`) apply **ONLY to the extra sections of Extended Report 2**: blending ingredients, tanks/bulk spirits/vessels, and barrels grouped by IST. **DO NOT apply these exclusions to physical inventory counting, product selection, Team A/B counts, location comparisons, WS reconciliation, or Report 1.** Prior notes asserting filtering for all inventory categories or physical count eligibility are superseded and must not be implemented. Preserve the same token-boundary matching behavior within the extended-only scope. Other report sections should retain their existing inventory/reconciliation scope unchanged.

### 2026-11-15 — Performance-first architecture and historical inventory lookup

User emphasizes **timing is crucial**; choose storage/indexing/caching architecture based on measured performance, not merely ease of Google Sheets setup. Hosting remains Google Apps Script, but benchmark read/write and historical queries before final storage decision. Avoid per-scan SPIRITS/WS network round trips; use locally cached/indexed reference data with controlled refresh, and keep write operations durable. Separate Inventory data from SPIRITS operational database.

**New Phase 2 reconciliation feature:** when viewing an item, retrieve prior inventory dates and show historical **original official WS quantity, frozen physical quantity, initial difference**, plus updated WS snapshot/final difference when available. User should be able to select previous inventory dates; current data must remain distinct.

**New Phase 1 physical counting feature:** show the selected item's **previous inventory locations and quantities** (historical location-level physical records) as read-only guidance. Do not copy historical counts into current counts; retain exact prior locations and UOM, and allow comparison. Efficient indexed product/date lookups; avoid loading all historical rows on each scan. Preserve historical sessions, snapshots, and location records permanently for these features. These are requirements, not implemented yet.

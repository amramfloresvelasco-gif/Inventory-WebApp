# Inventory Web App — Progress Log

## 2026-11-15 — Project initialized

**Repository:** https://github.com/amramfloresvelasco-gif/Inventory-WebApp  
**Branch:** main  
**Stage:** Phase 1 requirements/layout design.

### Confirmed
- Separate Inventory Web App, referencing SPIRITS enriched Finished Goods, Raw Materials and **active** Warehouses.
- Inventory-owned location table and count/history records; WS quantities for later reconciliation.
- Phase 1 = Inventory Entry; Phase 2 = Reconciliation.
- Team selector: Blue or Green; scan or manually choose Warehouse→Bay→Location.
- Product scan or manual Packaging/Finished Goods selection with dependent dropdowns.
- Location Empty and Item Not Counted statuses; notes; Stay in Location and Change Location submission actions.
- Finished Goods case and loose bottle quantity in the same submission.
- Full-pallet multiplier defaults to **1**; partial pallet and loose bottles supported; 5×100 cases + 1×50 cases + 4 bottles = **7 records** for 550 cases + 4 bottles.
- Legacy screenshot and three scripts supplied for behavior review, not wholesale reuse.

### Work performed
- Verified the new repository exists and is writable.
- Prepared and published initial README, Project Handbook, Progress Log, and Next Lucy Handoff on `main`.

### Not yet performed
- App source code, database/schema verification, scripts deployment, UI implementation, performance tests.

### Next
- Resume Phase 1 layout walkthrough with user; resolve remaining UX details, particularly fast direct-case entry and multiple partial pallets.
- Only then plan and build backend. Keep this file and handoff current with verified commits and tests.

### 2026-11-15 — Location master clarification

User confirmed that **Packaging and Finished Goods already use the same databases as SPIRITS**. Do not duplicate them. **Inventory must create a new Locations table**. Active warehouses remain SPIRITS-managed. Proposed Location fields documented as a draft only; actual table not created. Next: confirm location hierarchy, barcode format and identifiers with user, then inspect SPIRITS schemas.

### 2026-11-15 — Existing labels and barcode formats

Confirmed physical locations already have naming and printed barcodes. Dry Goods/Packaging currently use 2D barcodes; Finished Goods use QR codes. Future migration to all QR is possible. Preserve existing identifiers and support both formats; clarify code samples and whether formats apply to products/locations. Documentation only; no database or scanner implementation yet.

### 2026-11-15 — Unique barcode confirmation

User confirmed everything already has a unique barcode. Location scans and product scans will use existing identifiers. Barcode payload examples and location import source remain to be verified. No implementation yet.

### 2026-11-15 — Visual progress map requirement

User supplied a PULASKI BAY 1 warehouse-layout screenshot and requested a progress map linked to the new Locations table. Status colors confirmed: neutral/uncolored = not started, yellow = one team started, red = both teams differ, green = 100% match. Preserve physical lane/rack arrangement. Suggested, not approved: Finish Location action to prevent false mismatch during partial counting; clickable location details and summary metrics. No map implemented. Next ask for editable/source layout and agree how a team signals location completion.

### 2026-11-15 — Completion workflow resolved

User rejected the proposed Finish Location action. Small teams report completion verbally; supervisor checks the live mismatch map afterward. Map colors update from submitted records alone, with red treated as provisional until counting is done. No completion control or mandatory close step. Documentation only.

### 2026-11-15 — Source spreadsheet inspected; Location Management requested

Read connected spreadsheet `13TdeoVaNFGD8E-eEREhuW1QBhzg1QtDFSWkeKQXs5rQ`. Verified tabs `Fixed Data`, `Lynnville Map`, `Pulaski map`. `Fixed Data!A:C` headers: Location, Warehouse, Bay; sample Pulaski Bay 1 locations. Map tabs include layout labels and status lists. User explicitly requested **Location Management** to create/edit/activate/deactivate locations. Preserve legacy workbook; import to a new Inventory-owned location master after validating identifiers/barcodes. Documentation only; no writes to source spreadsheet or new tables.

### 2026-11-15 — Legacy 20-column entry structure and location lock

User provided current Inventory Log 20 columns, clarified `Uniquekey` is for cross-team matching while `App_Internal_ID` is per-entry unique ID. Confirmed temporary **location selection lock** so an employee can submit many products at one location without rescanning; unlock to change locations. Proposed stable-ID comparison keys, SubmissionID, InventorySessionID and verified-save semantics; not yet approved or implemented.

### 2026-11-15 — Submit UI and parent-child IDs confirmed

User approved **one Submit button + Lock/Unlock Location** replacing legacy two-button workflow. Confirmed system-generated parent-child `App_Internal_ID` pattern: parent ID `55dsgh`, child IDs `55dsgh-A`, `55dsgh-B`, etc. Recommended parent as submission metadata rather than an extra counted row; confirm whether first physical row should carry unsuffixed parent ID. Seven-pallet-example records stay seven, not eight. No implementation yet.

### 2026-11-15 — Entry edit/delete audit design discussed

User wants employee-accessible editing/deletion instead of manual fixes. Options: archive/move old rows, or retain old rows with `Valid` flag. Assistant recommended retain+invalidate+new replacement ID, plus append-only audit log, with individual-child vs whole-family edits. **Recommendation pending user approval; not implemented.**

### 2026-11-15 — Edit constraints confirmed

User confirmed edit operations may correct only the existing child records in a submission. Five pallets remain five pallets; no adding bottles or more pallets via Edit. Additional stock requires New Entry. Updated design notes; no implementation.

### 2026-11-15 — Blind inventory and own-entry permissions confirmed

User confirmed employees may view/edit/delete **only their own submitted entries**; inventory is blind. No other employees' quantities or Blue/Green comparison data in employee UX. Supervisor-only progress map and discrepancies; server-side ownership checks mandatory. Documentation updated; no code yet.

### 2026-11-15 — Workspace sign-in selected

User selected Google Workspace sign-in for `@bsb.com`, `@bigmachinedistillery.com`, and additional group domains. Proposed configurable domain/user/role allowlists. Must verify Apps Script server-side caller identity for actual deployment before implementing blind ownership. No code yet.

### 2026-11-15 — Team assignment clarified

User confirmed admins grant app access only, **not** team assignment. Any authorized employee may choose Team A or Team B. Team choice stored per entry; personal blind visibility unchanged. Session-level team lock is an assistant proposal, not yet approved. No implementation.

### 2026-11-15 — Phase 1 defined; team unlock approved

User confirmed Phase 1 = accurate independent counts for Team A and Team B; WS reconciliation deferred to Phase 2. Employees may switch teams within an inventory event, but must explicitly **Unlock Team** to change selected team and relock it. Team and location locks are independent. Documentation only; no app code yet.

### 2026-11-15 — Voice Entry feature requested

User wants speech recognition for location selection and complete entry: “Location PRA-L1-C4 5 pallets Pickers 1lt with 100 cases each.” Proposed Phase 1 tap-to-speak form autofill, exact master validation and confirmation before saving; generate five 100-case child rows. Test mobile browser/microphone compatibility and warehouse noise. No voice implementation yet.

### 2026-11-15 — Separate voice microphones agreed

User refined Phase 1 voice UX: location mic accepts only location identifier; product mic accepts product/pallet breakdown and may include `keep location`. Example 3 full pallets x 100 cases + 1 partial x 20 cases = 4 child records, 320 cases, location retained. No implementation.

### 2026-11-15 — Voice command for next location confirmed

User example: 5 full pallets x 100 cases plus 1 partial pallet x 20 cases of Pickers Original 1L = **six child records**, 520 cases. Spoken `new location` or `change location` means submit at current location, then unlock/clear location **only after verified save**. Opposite of `keep location`. No implementation.

### 2026-11-15 — Voice product alias challenge

User example: official `Borchetta Bourbon #473 2025 750mL/6pk` versus spoken `Borchetta Bourbon Racecar 2025 473 20 cases`. Need voice-to-catalog matching tolerant of nicknames/reordering/omitted pack, while extracting 20-case quantity and avoiding wrong-SKU saves. Proposed approved aliases and attribute matching with explicit confirmation. No code.

### 2026-11-15 — Mandatory voice review and Save/Cancel confirmed

User explicitly requires that employees see what they said on screen before submission and choose **Save** or **Cancel**. Never auto-save speech recognition. Display transcript and interpreted count for verification; Save writes validated records, Cancel writes nothing. No implementation yet.

### 2026-11-15 — Under-4-second performance requirement

User reports old AppSheet/script inventory entries take <4s and requires new Phase 1 app to be **<4s**, including voice-assisted entry. This is an acceptance target, not yet measured. Record voice transcription, matching, human review, save and verified completion separately; one batched save for multiple pallet children, local preloaded master lookup where possible. No implementation.

### 2026-11-15 — Supervisor discrepancy monitoring discussed

User shared screenshot of current spreadsheet columns Location, Item Name, UOM, Warehouse, Bay, Count 1, Count 2, Match, Helper Column and wants an admin module to monitor Team A/B discrepancies. Proposed supervisor-only live comparison, match/mismatch/pending states, event+location+product+UOM key and valid-child aggregation. Missing team count is not zero. No code.

### 2026-11-15 — Existing comparison is live, not manual

User clarified current reconciliation tab already updates live via ARRAYFORMULA, VLOOKUP, QUERY, MAP, etc. Corrected prior assumption. Future Admin design should first inspect formulas/dependencies and preserve working comparison logic; no implementation.

### 2026-11-15 — Admin discrepancy requirements gathering, not implementation

User clarified they are walking through **how discrepancies are handled**, and want existing live formulas revisited to see whether there is a better way. Do not choose an engine or implement before studying the rules and formulas. Await further workflow details.

### 2026-11-15 — Clickable discrepancy map behavior confirmed

User requires clicking a colored warehouse location to explain its color. For red, admin sees **Team A vs Team B aggregated product/UOM totals side by side**, e.g. 100 vs 99, **regardless of entry count**. Sum valid child records; do not show individual entry detail by default. Blind employee counts remain private. No implementation.

### 2026-11-15 — Dynamic red/yellow/green map semantics confirmed

User: Team A counting five products alone => yellow. As soon as Team B starts in same location, mismatch => **red immediately**, even before B finishes. As B catches up, if all aggregate product/UOM totals match => **green**, otherwise red. All discrepancies red; no finish-location button. Recompute on every valid count change. No implementation.

### 2026-11-15 — Separate admin reconciliation table required

User confirms admin needs **both** interactive warehouse map **and** spreadsheet-like comparison module with filters by **location, item, and match status**. Table shows aggregate Team A/B quantities, not individual submissions. Keep map/table driven by same live comparison engine. No implementation.

### 2026-11-15 — Finished Goods comparison identifier discussed

Dry Goods use Item ID. Recommended using existing stable SPIRITS Finished Goods Product ID for FG comparison; exact field and uniqueness must be verified before treating as confirmed. No implementation.

### 2026-11-15 — Confirmed Finished Goods ProductID exists

Read live SPIRITS `BMD V4 — Database`: `Products` column A = `ProductID` (UUIDs), with ProductName, SizeML, UnitsPerCase; `Releases` includes ReleaseID, WSMasterID, ProductID. Existing identifiers are available; need to determine product vs release granularity before final Inventory key selection. Read-only inspection, no implementation.

### 2026-11-15 — Require WS Finished Goods identifier

User confirms FG records must include WS Finished Goods ID in addition to SPIRITS internal ID. Candidate existing source is `Releases.WSMasterID`; verify equivalence/mapping before implementation. No new field or code yet.

### 2026-11-15 — Correction: WSFinishedGoodsID not verified

User says WSFinishedGoodsID is missing; assistant had incorrectly implied `Releases.WSMasterID` definitely satisfied the requirement. No such column was observed in inspected SPIRITS Products/Releases. Verify against official WS finished goods source before reuse or adding field. No implementation.

### 2026-11-15 — ReleaseID flagged as abandoned legacy design

User says `ReleaseID` was originally discussed but later discarded and likely unused. Do not use it in Inventory App model absent proof of active use; audit dependencies before removing from SPIRITS. Keep ProductID plus verified WS FG ID as intended identifiers. No code changes.

### 2026-11-15 — Confirmed WS-ID/name interchangeable lookup, internal IDs hidden

Dry Goods: scan WSRawMaterialID or find material by name -> same item. Finished Goods: scan WSFinishedGoodsID or find by name -> same SKU. Internal SPIRITS MaterialID/ProductID never visible to employees. Resolve both input modes to one canonical identity; disambiguate similar names. WS FG ID mapping still to verify. No implementation.

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

### 2026-11-15 — Google-native architecture and existing fast workbook confirmed

User says their existing primitive inventory workbook (built with Google Sheets, Apps Script, modals, and AppSheet) already performs virtually instantly. **Keep Inventory Web App hosted in Google Drive / Google Apps Script / Google Sheets**, do not introduce an external database as a presumed performance improvement. **Audit and reuse proven existing workbook patterns** where appropriate; prioritize scan/save responsiveness and measure end-to-end latency. Proposed performance goals (not guaranteed): barcode lookup ~<1s, save <2s, location switch near-instant, historical lookup <2s, map updates <2s. Avoid redundant RPCs, broad range reads, and per-scan SPIRITS calls. Existing workbook is evidence of feasibility, not a guarantee that a new implementation will automatically match performance. Ask user for exact workbook link only when necessary to inspect its actual code/workflow.

### 2026-11-15 — Existing Inventory Log Template inspected directly

User had already supplied working legacy workbook: `Inventory Log Template`, spreadsheet `13TdeoVaNFGD8E-eEREhuW1QBhzg1QtDFSWkeKQXs5rQ`, link `https://docs.google.com/spreadsheets/d/13TdeoVaNFGD8E-eEREhuW1QBhzg1QtDFSWkeKQXs5rQ/edit?gid=1789587392`. Read-only Google Drive inspection confirms tabs: `EnterData` (scan/count form), `Inventory Log` (Count, Location, Warehouse, Bay, Item Name, Item ID, Qty, UOM, Class of material, User, Timestamp, Uniquekey, Notes, App_Internal_ID, Extra_Bottle_Qty, Entry_Method), `1VS2` (count comparison), `CountsvsERP` (WS reconciliation), `1stCount`, `2ndCount`, `Fixed Data` (locations and raw/FG references), `Locations Match`, `Inventory User State` (User, Count, Warehouse, Bay, Location), `WSFRM`, `WSFFG`, `Lynnville Map`, `Pulaski map`, and archived log copies. Sample records show `Case`, `Bottle`, `Each` UOM, location-level first/second counts, and FG extra bottle quantity. Existing workbook has live 2026 records; **do not modify it** while auditing. Use its schema and map layouts as reference; still need to inspect underlying Apps Script and AppSheet implementation separately, which is NOT yet verified. User previously supplied this exact URL; do not ask again.

### 2026-11-15 — Legacy Inventory source code supplied (3 files)

User uploaded three complete legacy source files in this conversation: `Pasted text(9).txt` (~1162 lines; Apps Script backend), `Pasted text (2)(2).txt` (~1273 lines; HTML/JS modal entry), and `Pasted text (3)(1).txt` (~1791 lines; manual/automatic repair engine). These are source references for implementation, not yet copied into the repo. Backend exposes `onOpen`, `showModalForm`, `showEditorSidebar`, `getDriveImageAsDataUrl`, `buildItemMap`, `lookupItemNameAndClass`, `lookupItemIDFromManualName`, `getValidationLists`, `lookupLocationReferences`, `searchAllEntries`, `getUOMOptions`, `updateEntry`, `submitData`, `processInventoryChange`, `executeMultipliers`, and child-ID/finished helpers. Modal handles warehouse/bay/location cascading, scan/manual lookup, case+bottle entry, status flags, and submit modes. Repair engine handles `App_Internal_ID` parent/child families, missing rows, multipliers, and `Script Finished` flags, with `autoRepairIncompleteInventory`. Key reusable patterns: batch read/write, `LockService`, stable parent-child IDs, local location filtering, idempotent repair. **Audit all code before reuse**, especially potential costly whole-sheet reads, permission checks, duplicate handling, and consistency. Legacy `Inventory Log Template` is still live and must not be modified. User has now provided the scripts; do not ask for them again. Current task is source audit and development planning; no app code deployed yet.

### 2026-11-15 — Phase 1 legacy source audit completed

Inspected uploaded backend, modal and repair code, and repository root. Created `docs/LEGACY_CODE_AUDIT.md` on main (commit `fd1860dd203f62b402ef48dc52420595e07fd8e4`). Repo currently has README + docs, no app source. Reusable: startup validation-list preload, client-side location filtering, batched 20-column submit under ScriptLock, parent/child IDs, idempotent repair patterns. Issues to solve: per-lookup full `Fixed Data!P:S` scan, linear name lookup, per-submit full location scan, full-log reads for searches/repair, client-supplied row editing without verified server authorization, client-trusted product/team values, and missing session dimension in composite key. Proposed indexed/versioned compact reference caches, session-specific immutable history, original/updated WS snapshots, audited edits and idempotency keys. This is **documentation/audit only**; no app source, database, or deployment created yet. Next: implement isolated Google-native foundation, after verifying schema and testing access; never touch working legacy workbook or SPIRITS production data.

### 2026-11-15 — Explicit workbook separation (user correction)

**We are creating a BRAND-NEW Google Sheets workbook** as the Inventory Web App's operational database, with a new standalone Apps Script web app. The supplied `Inventory Log Template` workbook (`13TdeoVaNFGD8E-eEREhuW1QBhzg1QtDFSWkeKQXs5rQ`) and its uploaded Apps Script/HTML/repair code are **READ-ONLY REFERENCE MATERIAL ONLY**. Never write new app tables, test data, scripts, migrations, or deployments into the legacy workbook. New counting, locations, users, historical sessions, snapshots, and reconciliation live in the new workbook. SPIRITS V4 and WS sources remain read-only for this project. Work on GitHub `main`. Next task is to create the new workbook and foundational schema, not modify the old file.

### 2026-11-15 — NEW Google Sheets Inventory database CREATED (Phase 1)

**Created separate native Google Sheets workbook:** `BMD Inventory — Database`, ID `12teaGz7z2Ems-Elqz5vHv1Z8S5aV4kJMJrnBxlMYQ5Y`, URL https://docs.google.com/spreadsheets/d/12teaGz7z2Ems-Elqz5vHv1Z8S5aV4kJMJrnBxlMYQ5Y/edit . This is the new operational database; the legacy workbook is untouched. Verified 14 tabs: `InventorySessions`, `AppUsers`, `Locations`, `ProductIndex`, `CountEntries`, `CountEntryAudit`, `LocationStatus`, `WSSnapshots`, `WSRows`, `Reconciliation`, `HistoricalProductLocations`, `OwnershipExclusions`, `SyncStatus`, `AppConfig`. All have headers and frozen header row. Populated **138 Locations**: Pulaski 100, Lynnville 38; verified location header/sample rows. Seeded extended-report-only exclusion tokens JYP, OTS, Dios, SCG. `AppConfig` includes schema version 1 and read-only source IDs. No inventory count data, user accounts, WS snapshots, or SPIRITS source data imported yet; no Apps Script project/deployment yet. **Next:** implement GitHub Apps Script backend with read-only initialization, validated product/location lookup, secure user/team access, and batched idempotent count write; create new standalone Apps Script project/deployment separately. Never write to the legacy workbook or SPIRITS source.

### 2026-11-15 — Initial Inventory Apps Script code committed on main

Created `src/Code.gs` (commit `719e7d28140ad7b29f5d438f0c433056a4751a73`), `src/Index.html` (commit `ef7caec1fb865c0310a92f99d8f5e511258a2d39`), and `src/appsscript.json` (commit `2689dd261818d8b786554c713312c2a43a829aca`). Initial server: database ID points ONLY to new workbook; user allowlist in AppUsers; role/Team A/B lock validation; open session check; cached location/product references; count validation; ScriptLock; duplicate EntryID detection; batched single-row write; timing. UI: warehouse/bay/location cascade, barcode/name/ID search, UOM, quantity, notes, Save with retry-stable submission ID. **NOT DEPLOYED OR TESTED.** Critical prerequisites: ProductIndex empty, AppUsers empty, InventorySessions empty; no bootstrap admin yet. Manifest uses executeAs USER_ACCESSING / DOMAIN; requires access to new workbook for each signed-in user, which may be undesirable for row-level confidentiality. **Review deployment identity and least-privilege security before any release**; don't assume current manifest is production-safe. CountEntries duplicate scan currently reads all EntryIDs per save and needs benchmark/index optimization; cache invalidation after product updates still needed; app currently only handles single-unit entry and does not implement multipliers, previous-location history, voice, editing, map, reconciliation, or exports. Verify Apps Script manifest support and browser UUID behavior. Never deploy without permission testing and isolated sample data. Next: import validated ProductIndex from read-only SPIRITS/WS, add secure admin/session provisioning, tests, and connect standalone Apps Script project.

### 2026-11-15 — Initial administrator provisioned

In **NEW** workbook `12teaGz7z2Ems-Elqz5vHv1Z8S5aV4kJMJrnBxlMYQ5Y`, `AppUsers!A2:G2` now contains `abe.flores@bsbco.com | Administrator | Active | (no team) | FALSE | 2026-11-15 | Initial administrator provisioning`. Read-back verified. Administrator access is an allowlist database record only; standalone Apps Script web app remains undeployed, so login/permissions are not yet runtime-tested. Do not assume administrator can count until a team is assigned/locked or a deliberate admin override is designed.

### 2026-11-15 — Administrator UI and session provisioning implemented in GitHub

Updated `src/Code.gs` commit `6386e3626a89ebfbd1ff5f87200887ec9a8c6a62`: server-authorized `apiInventoryAdminOverview`, `apiInventoryAdminUpsertUser`, `apiInventoryAdminCreateSession`. Uses admin allowlist, lock, validates email/role/status/team, protects current admin from self-revocation, and prevents multiple open sessions. Updated `src/Index.html` commit `32a84ad9e7785776d98ef7ced5fc1b236bd256e4`: administrator controls for user provisioning, Team A/B lock, and new inventory session. Added `src/Tests.gs` commit `9730886f0aac5d553b42f1051db56adc7bba93bc` read-only schema/locations/admin smoke test. **No Apps Script project deployed and no runtime tests executed.** Database AppUsers administrator row remains provisioned, other data tables empty. Important security concern: manifest `executeAs: USER_ACCESSING` requires each employee to access underlying database; review execution identity and spreadsheet permissions before deployment. Also test UI duplicate-click handling, current admin role access, and inventory date parsing. Next: prepare standalone Apps Script deployment, validated product import, and run tests on isolated app. Existing legacy workbook and SPIRITS unchanged.

### 2026-11-15 — Read-only SPIRITS catalog integration committed

Verified live SPIRITS source tab headers via connected Google Sheets: `Material Reference` = `Category, Material ID, Material Name`; `Products` = `ProductID, BrandID, ProductName, SizeML, UnitsPerCase, TargetProof, Status, CreatedAt, UpdatedAt, WSFinishedGoodsID, WSFinishedGoodName, SubtypeID`. Created `src/Catalog.gs` commits `14f6020746109e72a559ce0490335188b0a95086`, `96c09828718eb0919d4cf030466215dea8a03e21`: read-only SPIRITS source fetch, active finished goods/units-per-case mapping, material reference mapping, duplicate-ID conflict/missing-ID validation, guarded admin-only first import (refuses any conflict or existing ProductIndex data), and cache invalidation after import. Known blending categories skipped for countable catalog; need confirm complete source category taxonomy. Updated admin UI `src/Index.html` commit `b9572d84f7712d3f2f93a599f36e1dc7f39475a7` with **Preview source catalog** button, no automatic import. **No catalog import performed, no runtime tests, no Apps Script deployment.** Source IDs were verified from header and sample rows; full dataset not yet audited for conflicts. Next: verify full category taxonomy, IDs, and units; secure deployment identity; create standalone Apps Script project and run smoke tests. Working legacy workbook and SPIRITS untouched.

### 2026-11-15 — Direct source catalog audit and deployment security correction

Read SPIRITS `Material Reference!A1:C1200` (710 populated rows): **421 packaging**, **99 ingredients**, **190 bulk**; no missing IDs/names or conflicting duplicate ID/name pairs in inspected data. Read `Products!A1:L1200` (231 rows, **230 active**): active FG all had WSFinishedGoodsID, WSFinishedGoodName and positive UnitsPerCase; no conflicting IDs; no overlap between active FG IDs and packaging IDs. **This is source inspection, NOT an Apps Script runtime test.** `src/Catalog.gs` commit `531c3581dcf0eacfc96f66dac91f67baa3b57e50` now recognizes exact categories and imports only packaging + active FG as a conservative provisional subset (expected 651 unique records). **Outstanding business-rule decision:** ingredients/raw materials physical-count eligibility vs extended-only blending ingredients; do not silently exclude all ingredients permanently. Bulk excluded pending review. `src/appsscript.json` commit `0f61befc3ac04a4a70d9bbc6966ccf5e6c225602` changed webapp execution identity to `USER_DEPLOYING` so counter users need not have direct Sheet access; must runtime-test Session.getActiveUser().getEmail() with same-domain users and enforce authorized users. No source workbook writes, no catalog import, no app deployment yet. Next: confirm exact countable material taxonomy, test execution identity, create standalone Apps Script project and deploy privately.

### 2026-11-15 — User clarified count eligibility and warehouse flag

**User rule:** Physical inventory includes ALL raw materials (packaging, ingredients, bulk) and finished goods **for warehouses with `Counts=TRUE` in SPIRITS**. Inspected SPIRITS `RawMaterialWarehouses!A1:F100`: Counts=TRUE, Active=TRUE IDs `1610` Berlin, `344` Default, `1546` Default Tax Paid, `1592` Lynnville, `1593` Pulaski Tax Paid, `1574` Pulaski; Counts=FALSE IDs `1595` Lipman and `1642` Lynnvillle TR/GS. Corrected `src/Catalog.gs` commit `36b00950ff0c4756d1e77c1813f5d37ce31a170f`: includes all Material Reference categories as countable; exposes counting warehouses in preview; adds helper `invCountingWarehouseIds_()` for future WS filtering. Also removed accidental literal backslash-n sequences in source comments. **Important pending:** This warehouse filter is NOT YET wired into WS snapshot import/reconciliation; `ProductIndex` has no per-warehouse field, so apply Counts flag when processing warehouse-level WS records, not as a blanket product exclusion. Material UOM is currently provisionally 'Each'; must join SPIRITS `Materials.UOM` by WSRawMaterialID before import, preserve correct case/gallon/each conversions. No catalog import or deployment yet.

### 2026-11-15 — Material UOM integrity check and possible source identified

SPIRITS `Materials!A1:J1200` contains only headers (0 material records), so its `UOM` column cannot supply verified units for the 710 `Material Reference` records. Corrected `src/Catalog.gs` commit `953b2980e41b3cb1d23d138affd525ed2efdcfd0` to reject import until material UOM verified rather than defaulting all to Each; repaired literal `\\n` artifacts. Corrected `src/Code.gs` commit `068383e27c9386b76dff2de3facd0d588a316278` to enforce configured material UOM on save and `src/Index.html` commit `b78137bd9c17ef4eeca9b2b0cb65813cd69732e3` to show configured UOM. **Additional discovery:** read-only legacy workbook `Inventory Log Template` tab `WSFRM` includes `RawMaterialId`, `UnitOfMeasure`, `UnitOfMeasure_Name`, `WarehouseId`, `WarehouseName` and could be used to validate UOM by ID. However this legacy tab may be stale; DO NOT treat as current official WS without timestamp check. Next: identify fresh authoritative WS raw material source and reconcile UOM conflicts; do not write legacy workbook. No import or deployment yet.

### 2026-11-15 — UOM coverage audit and diagnostics

Read-only compared SPIRITS `Material Reference` (710 material IDs) against legacy `Inventory Log Template` `WSFRM` (1067 rows, 560 unique WS RawMaterialIds). **508/710** material IDs have legacy UOM candidate; **202/710** absent: 190 `bulk`, 12 `packaging`. No conflicting UOM values for a single ID in WSFRM. Observed WSFRM UOMs: Each, Pounds, Gallons, Kilograms, FluidOunces, Grams. Legacy source freshness not verified; **do not use its UOMs as authoritative** or import them automatically. Commit `fd2a65726fb986bcf40be98826c69bb32fad98d9` updates `src/Catalog.gs` with admin-preview-only diagnostic matching; preserves import block for missing verified official UOM. New source read from legacy workbook is read-only. Need locate current official WS raw-material data feed including UOM and reconcile all bulk IDs before catalog import; consider separate bulk catalog if those IDs are not WS raw material IDs. No deployment or database import yet.

### 2026-11-15 — User confirmed supported UOMs and legacy-zero rule

Raw materials support ONLY `Each`, `Pounds`, `Gallons`; finished goods `Case`, `Bottle` with verified UnitsPerCase. User instructs legacy raw UOMs (Kilograms, FluidOunces, Grams, etc.) have **effective quantity 0**, not converted or counted in reconciliation. Source UOM remains for traceability. Commit `e0407c0febd99c911033a2e85bdb5258cd81fe7d` adds `invNormalizeRawQuantity_(uom,quantity)` returning zero for unsupported UOM and repairs literal backslash-n source formatting; commit `7d87d5a180f5ff635ab87257bb9a0067eb82f9f1` enforces allowed raw count UOMs server-side. **Normalization helper is NOT yet connected to a WS snapshot import/reconciliation pipeline (not built).** No legacy rows overwritten or quantities set to zero in source sheets. Catalog import still blocked pending authoritative UOM mapping. No deployment.

### 2026-11-15 — Fermentation Support exclusion

User explicitly excluded all `Fermentation_Support` material records from physical inventory and WS reconciliation (not merely effective zero). In read-only legacy `WSFRM`, IDs `71525`, `74134`, `154140`, `74135` are Fermentation_Support with positive Kilograms quantities. Checked SPIRITS `Material Reference!A1:C1200`: **none of these four IDs are present**, so the SPIRITS reference-based initial catalog already excludes them. Commits `536d06b219a7e817ca86a4ae1500f2e8afa99821` and `f5f96f89c29b67e4d8edc1f7ca5f94658137467d` add defensive category exclusion for legacy catalog matches and `invIsExcludedMaterialClass_` / `invEligibleWSRawRow_` helpers for future WS row filtering. **WS snapshot import is not built; helper is not yet wired into reconciliation.** Ensure future importer filters by warehouse `Counts=TRUE` AND excludes Fermentation_Support before UOM normalization. No database write, import or deployment.

### 2026-11-15 — Initial WS snapshot backend

Created `src/WSSnapshots.gs` commit `958d278b9d6dbdf3aa921a96608a44cff9088f6b`, updated `caebc36b47ebd94d762e803285003ba004f55b48`: `invWsSnapshotPreview_`, `apiInventoryAdminPreviewWSSnapshot`, `apiInventoryAdminSaveOriginalWSSnapshot`. Server checks administrator, open session, required source timestamp, Counts=TRUE active warehouse IDs from SPIRITS, excludes Fermentation_Support, zeros unsupported raw UOM quantities, accepts finished goods Case/Bottle, rejects invalid quantities, persists WSRows and WSSnapshots and sets session OriginalWSSnapshotID. Blocks duplicate original snapshot even if session pointer missing. **Caveats:** No import UI, no live WS connector, no runtime test, no reconciliation engine yet. Google Sheets multi-sheet writes are not transactional: interrupted import could leave orphan WSRows; need staged validation/recovery and audit. `WSRows` stores effective quantity, not raw source quantity/UOM provenance beyond UOM; design additional audit preservation before production. WS item identity/class mapping requires source-specific validation. No data imported and no deployment.

### 2026-11-15 — WS source preservation and reconciliation preview

`src/Code.gs` commit `8d0f515d239b1343266bf239571a4bfecebba4af` registers WSSnapshots/WSRows schemas (fixes `invRows_` failure). `src/WSSnapshots.gs` commit `234b34a714d2dae1d0bc00b9bc15373f093ee0e6` repairs literal newline artifacts and **stores original WS source quantity** in WSRows instead of destructive effective-zero normalization; unsupported raw UOM normalized to zero at reconciliation time only. `src/Reconciliation.gs` commit `c280f65a449a3421af1c14b271e49640af2050b6` adds admin-only read-only `apiInventoryAdminReconciliationPreview`: original snapshot, team A/B aggregate, FG bottle-to-case conversion, raw UOM validation, per-item difference, invalid rows and team match flag. **Critical limitations:** aggregate team equality does not prove per-location equality; missing location counts can appear as zeros, so preview explicitly NOT a freeze gate. Need location completion map, ownership-safe edits, official source connector, per-item UOM provenance audit, and live tests. No data imported, no deployment, no production changes.

### 2026-11-15 — Session-driven WS snapshot cadence (user decision)

User confirmed: **NO daily inventory WS snapshot, NO daily trigger, NO background polling outside an explicitly created inventory session**. Example: without a November 2026 inventory session, script must be silent. On administrator-created OPEN inventory session, take original WS snapshot only when deliberately initiated for that session; preserve original immutable snapshot. Any later updated WS snapshot is also session-specific and explicitly initiated, not daily. `src/WSSnapshots.gs` commit `5c1496f46f6dae442fa4afaf545423ed804b7169` clarifies explicit session-only call. Current code has no time-based trigger. Do not introduce scheduled inventory jobs. No deployment or runtime test.

### 2026-11-15 — Parse repair and event-driven import hardening

Fixed literal `\\n` source artifacts in `src/Code.gs` (`45efeb939df0cafcbfda33b93d0dd9750badeafb`) and `src/Catalog.gs` (`6b73e60211e4032b2f48ae344ae2ecb1f208e797`), which could break Apps Script parsing. `src/WSSnapshots.gs` (`1280ec0896d35e04a2dcfaa926fff1ca6f1a861b`, `e78998af2f4c147d91823522e78e4c3b0588c577`) rejects blank quantities and writes explicit-session snapshots in 500-row chunks. No scheduled triggers added. **Not runtime tested or deployed.** Outstanding: robust idempotent partial-import recovery, correct WS source field/class mapping, original WS feed integration, location-level A/B completion, catalog official UOM resolution.

### 2026-11-15 — Location-level read-only mismatch preview

Created `src/LocationComparison.gs` commit `398dc9b48629488133a9d2eee0a15831b7ab0d78`, registered `LocationStatus` schema in `src/Code.gs` commit `f6f51f8b3320bb7e9df815ad734bfc5528a5e6a3`. Admin-only preview groups active count entries by session/location/team/product and normalized unit (FG bottles->cases) and identifies mismatches. Neutral for no activity, yellow for started without mismatch, red for mismatch. **Intentionally never green or freezeAllowed:** explicit two-team location completion and EMPTY confirmation have not been implemented, and no implicit completion is allowed. No old inventory script copied; new standalone backend only. No data writes, no deployment, no runtime test. Next: design explicit completion events/permissions and green eligibility, then test with synthetic data.

### 2026-11-15 — Corrected location status rule (user correction)

**No Finish Location button or explicit team completion step.** Map status updates automatically from Team A/B submitted counts: neutral neither, yellow only one team, red both with mismatched product/unit totals, green both with matching totals. Empty locations require explicit EMPTY/NO COUNT submissions (not a Finish button), not yet implemented. Updated `src/LocationComparison.gs` commit `573f2d4481f6794af1ede806c99fb5f43bc89422`. `freezeAllowed` intentionally remains false until EMPTY handling and validation are built. **Caution:** current implementation treats both teams having any count as green if their submitted items match; it cannot detect omitted products without additional completeness validation. No runtime test/deployment.

### 2026-11-15 — EMPTY versus items mismatch

User confirmed: if Team A submits EMPTY and Team B submits any items for the same location (or reverse), location must be RED. EMPTY+EMPTY GREEN; one EMPTY with no submission by other team YELLOW. Updated `src/LocationComparison.gs` commit `9a9f0b49836c5c661f14f3cad2efbe062d6afd48` to recognize active `CountEntries` with `EntryMethod='EMPTY'`, count them as team activity and flag cross-team and same-team EMPTY-versus-items conflicts. **EMPTY submission endpoint/UI not yet implemented**; current count save requires product. Freeze remains disabled. No runtime tests or data writes.

### 2026-11-15 — EMPTY location submission endpoint and UI

`src/Code.gs` commit `4e38424521fab0119f684f7fa3f99b2d88b1a0cc` adds `apiInventoryMarkEmpty` with authenticated locked-team validation, OPEN session/location checks, script lock, idempotent submission ID, and prevents same-team active items coexisting with EMPTY; `apiInventorySaveCount` also rejects new item counts if same team has active EMPTY. `src/Index.html` commit `d58071b17e32225fbe4bd8d0c78d6e8f631bc836` adds mobile Mark location EMPTY action with confirmation and retry ID. `src/LocationComparison.gs` commit `480067445799c75f22698d381404e0d44b69a053` prevents invalid count rows from reporting allGreen. Team A EMPTY vs Team B items is RED; EMPTY vs EMPTY GREEN; single EMPTY YELLOW. No Finish Location. **Outstanding:** owner-scoped edit/delete/undo EMPTY, invalid entry handling per location, location map UI, unit/integration tests, final freeze gating. No deployment/runtime test, no data imported, no legacy source edits.

### 2026-11-15 — Owner-scoped correction and audited deletion

`src/Code.gs` commit `8157ca7e93cd7fa0e87753d8f3de782c3eab9120`: registered CountEntryAudit schema; added `apiInventoryMyEntries` (only own active records for counters, all for admins) and `apiInventoryDeleteEntry` (OPEN session, server ownership check, lock, append audit then soft-delete status). `src/Index.html` commit `e1bea7b7ac46311e9f9035b901542fd7513bff28`: Review my entries and Remove UI; EMPTY can be removed and then item counting resumed. No legacy source changes. **Remaining:** editing existing entries (currently remove and re-enter), runtime tests, audit write partial-failure recovery, session freeze validation, location map UI. No deployment or database writes.

### 2026-11-15 — Supervisor location status grid

Added administrator-only read-only location status grid to `src/Index.html`, commit `b6a1e1271491162a0b2410eb4f8ce5e17fe2b24b`, newline rendering fix `d9d9e563fe36dc3efaff96e51ce425e400925a50`. Manual Refresh location map calls `apiInventoryAdminLocationComparison`, shows neutral/yellow/red/green totals and location tiles; tapping a tile shows Team A/B entry counts, EMPTY markers, mismatch keys. No background polling or daily trigger; no Finish Location. **Important outstanding correctness:** map currently can show green when both teams have matching *submitted* entries but omitted items cannot be inferred; invalid records are reported globally and freeze remains blocked. Need synthetic tests and runtime deployment. No database changes.

### 2026-11-15 — Pure location comparison regression suite

Refactored `src/LocationComparison.gs` to expose pure `invLocationColor_` and `invLocationDifferences_` functions (`ee0d7910134232fc0108315bab6989798ef07c0e`, `0163f321caf045f034c1defa042a6563c2ab1bce`). Added `src/LocationComparisonTests.gs` (`fe3234021efb8b9db9bd8a2a52b8ca0a7f9a9746`) with 15 assertions for neutral/yellow/red/green, matching and mismatching product totals, EMPTY/EMPTY, EMPTY versus items, and same-team conflict. Run manually with `testInventoryLocationComparisonRules()` after Apps Script deployment. **Tests committed but NOT executed; no runtime access or DB changes.** Next: exercise Apps Script runtime and add integration tests, then harden freeze gate and reconciliation.


### 2026-11-15 — Extended location comparison regression coverage

Extended `src/LocationComparisonTests.gs` on `main` (commits `e25a27e61e2f6a81f94507a182d5bb4091818eb9`, `9860a53b24802d2b30742badb035b8412288f507`) with 11 additional pure assertions (26 total). New cases cover yellow→red→green transitions as Team B catches up, green→red after correction, removal returning to yellow/neutral, same-team EMPTY conflicts, mixed UOM and fractional equivalents. No Finish Location, background trigger or freeze enablement. **Tests have NOT been executed in Apps Script; no deployment or inventory data import.** Next: execute `testInventoryLocationComparisonRules()` in Apps Script, then add integration tests for entry corrections, location identity validation, and freeze safeguards. Current comparison can still report green for matching partial submissions; `freezeAllowed` remains false.


### 2026-11-15 — Active-entry map status and submission ID hardening

`src/LocationComparison.gs` commit `99ef8907d2ba6eba8181933e3de3400559d07803`: map Team A/B started flags now derive exclusively from active count/EMPTY submissions, not potentially stale LocationStatus flags; active entries referencing unknown/inactive locations are reported invalid. `src/Code.gs` commit `f34a98f08881505b6bfd64a8147206c244f507a4`: repeat count submission IDs are accepted as idempotent only when session, location, team, product, UOM, quantity and owner match; conflicting reuse throws. No runtime tests or deployment. Freeze remains disabled. **Next:** run Apps Script tests, add integration tests for deletion/EMPTY/status transitions and verify duplicate behavior. Product catalog not imported; no inventory data writes.


### 2026-11-15 — Deleted submission retry and comparison data validation

`src/Code.gs` commit `40b81a379019bda9869e690520d6b91059e3b112` rejects idempotent retries for previously DELETED count and EMPTY records, preventing false success after a user removes an entry. `src/LocationComparison.gs` commit `105e674595d97784c93121541b053eeda4674808` marks active non-integer/unsafe quantities and finished goods with missing/nonpositive/noninteger UnitsPerCase invalid, so these cannot silently contribute to green eligibility. **No Apps Script runtime execution or deployment; no live data changed.** Freeze remains disabled. Next: test correction/delete/EMPTY transitions with synthetic integration fixtures and run the existing 26 pure assertions. Catalog import and WS reconciliation remain pending.


### 2026-11-15 — Pure fixture regression suite for location comparison

Commits: `f2daae394c848ed32ff6fe7e20dce84c0755d7d6` corrected both-EMPTY conflict expectation (3 differences); `9b6a6b98b2e268dfa21f11741da71cddea7dc58d` rejects blank count and conversion fields; `a83a740f2e0bd17bb8bbfaed15d4a0fe46b7f850` extracted pure `invBuildLocationComparison_(sessionId,locationRows,productRows,entryRows)` while retaining session validation in live wrapper; `f50401350012a61f16cd64ae76a3e7d77f8deeef` added `src/LocationComparisonFixtureTests.gs` with 14 synthetic scenario checks. Run `testInventoryLocationComparisonRules` and `testInventoryLocationComparisonFixtures` in Apps Script. **Not yet executed or deployed**; no database modified; freeze remains disabled. Next: run both suites, verify errors, test ownership/idempotency workflows, then review completion/freeze criteria.


### 2026-11-15 — Fixture correction before runtime

Commit `e22392e88246ef8b08688b7f61bf1877a6312c0e` removes a contradictory fixture that expected a valid single-team finished-good count to be neutral; correct behavior is yellow. The fixture suite now contains 13 scenario checks, still **not executed in Apps Script**. Existing pure rule suite has 26 assertions. Run both functions before deployment. No database writes or freeze enablement.


### 2026-11-15 — Count endpoint rejects forged EMPTY and blank quantity

Commit `c96820782759558758fecc38c1465115686040aa` hardens `apiInventorySaveCount`: requires quantity to be present (blank/null/undefined no longer coerced to zero), accepts only Manual/Barcode/QR entry methods, and includes entry method in duplicate ID payload matching. EMPTY must be created through `apiInventoryMarkEmpty`. **No Apps Script runtime test or deployment; no live data changed.** Freeze remains disabled. Next: run pure rule and fixture suites, then test server-side count/EMPTY/delete/idempotency behavior with mock Sheets or Apps Script test database.


### 2026-11-15 — Local regression execution and FG conversion alignment

Executed current GitHub source of `src/LocationComparison.gs`, `src/LocationComparisonTests.gs`, and `src/LocationComparisonFixtureTests.gs` in an isolated JavaScript runtime with a stubbed Logger and INV_RAW_UOMS; results **PASS 26/26 rule assertions, PASS 13/13 fixture assertions** (39 total). This is **local pure-JS execution only**, not Apps Script deployment/runtime, not live Sheets. Commit `d719ab144ac53225c6644a4664e7cee8e9f3395b` aligns `apiInventorySaveCount` with comparison validation by requiring valid positive safe-integer UnitsPerCase for **both** Case and Bottle finished-goods submissions. No live data changed; freeze disabled. Next: Apps Script integration tests for save/EMPTY/delete and admin authorization, verify import and snapshot prerequisites, then deployment only after approval.

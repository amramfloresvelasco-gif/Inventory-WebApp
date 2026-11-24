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


### 2026-11-15 — In-memory count/EMPTY/delete integration simulation

Executed current `src/Code.gs` with in-memory stubs for `invSheet_`, `invRows_`, `invUser_`, `invReference_`, `invSession_`, LockService and Utilities. **PASS 13/13** scenarios: save, idempotent retry, changed-payload rejection, forged EMPTY rejection, blank quantity rejection, EMPTY blocked by own counts, cross-user deletion denied, owner deletion, deleted-count retry denied, EMPTY after deletion, count blocked by EMPTY, EMPTY deletion, deleted-EMPTY retry denied. Simulated state: two count rows, two audit rows. Combined with previously executed pure suites: **52/52 local checks passed**. This is NOT Apps Script runtime testing or real Google Sheets integration; no live data written, no deployment, freeze disabled. Next: preserve reproducible integration tests in repo, exercise Apps Script runtime with test data, then proceed to inventory location/catalog import and freeze prerequisites.


### 2026-11-15 — Reproducible Node count workflow test committed

Commit `1f9ce5603e89ab9a24bba33ff03a7259d5fb8efd` adds `tests/count-workflow.test.js`, a Node built-in VM/strict-assert mock integration harness loading the real `src/Code.gs` source and running 13 save/retry/EMPTY/delete/ownership checks against in-memory Sheets stubs. Run from repository root: `node tests/count-workflow.test.js`. Earlier equivalent 13 checks passed in an isolated JavaScript execution, but **the new committed Node file has not yet been run in Node**. No Apps Script runtime tests or deployment; no live data changed; freeze disabled. Next: execute committed Node test file and both comparison suites, fix any regressions, then Apps Script integration tests on safe test data.


### 2026-11-15 — Automated Node regression workflow

Commit `9a715ff1a07dcff5dea80c3c33ab635b2b361fb3` adds `tests/location-comparison.test.js`, loading actual Apps Script comparison sources in Node VM and asserting 26 rule + 13 fixture checks. Commit `7c8a60c73878f238d3b4645c377766c14deb3340` adds `.github/workflows/inventory-tests.yml` to run both Node test files (52 total checks) on relevant main pushes, PRs, and manual dispatch. Workflow uses read-only GitHub permissions, no Apps Script credentials, no database access, no deployment. **CI run result not yet verified**. Next: inspect GitHub Actions first run and resolve failures, then actual Apps Script test-database integration. Freeze disabled.


### 2026-11-15 — CI verification limitation and expanded mocked integration tests

GitHub connector checks for workflow commit `7c8a60c73878f238d3b4645c377766c14deb3340` returned empty combined statuses and no PR-triggered workflow runs; **this does not prove a push workflow passed or failed**. Commit `e0de4762da4be9a90dcfe9aa7d057119a34c6e4a` expands `tests/count-workflow.test.js` from 13 to 22 checks: new count after EMPTY removal, duplicate method mismatch, negative/fractional quantities, invalid product/location, admin deletion, audit actor, and hidden deleted entries. Combined planned CI suite: **61 checks (22 mocked workflow + 39 pure map)**. Expanded committed file not yet executed in Node or GitHub Actions. No Apps Script execution, deployment, or live data change. Freeze remains disabled. Next: verify CI via GitHub Actions UI/logs; fix test failures; run Apps Script integration with isolated test database.


### 2026-11-15 — Invalid active entries no longer yield green map locations

Commit `ddca00bba26811da1bee19f2122247ab6174082d`: location comparison now includes locationId in invalid entry diagnostics, returns invalidCount per location, and paints locations with invalid active entries red instead of misleading green/neutral. Commit `3ce15cc5771050ed7381c57fb7b3a17b917ca263`: update existing invalid-entry expectations and add fixture asserting matching valid A/B totals plus invalid entry => red. Commit `cd0d4ddab3a0b013d5db0d03bf84db79c837f884`: Node test runner expects 14 fixtures. Re-executed current comparison sources in isolated JavaScript: **26/26 rules and 14/14 fixtures PASS** (40). Counting mock suite has 22 scenarios in repo but current committed Node file and GitHub Actions result still unverified. Planned suite now **62 checks**. No Apps Script runtime, no deployment, no live database writes. Freeze disabled. Next: verify GitHub CI and run isolated Apps Script integration tests.


### 2026-11-15 — Linear invalid-entry aggregation and multi-location isolation test

Commit `d36f82bf06b4a2fae10cc16070c3f107da840b69` replaces per-location full invalid-entry scans with a one-pass `invalidCounts` map in `invBuildLocationComparison_`, preserving red status for invalid active entries. Commit `d7f7c005f45c46d55ca382967b50efcc08963d9d` adds a two-location fixture: valid matching L1 stays green while invalid L2 turns red, with scoped invalidCount. Commit `9ed14b4cbe9e775cd305cef475d09cd31d0f3fce` updates Node expected fixtures to 15. Executed current comparison sources in isolated JavaScript: **26/26 rules + 15/15 fixtures passed** (41). Counting mock suite has 22 scenarios committed but full Node/GitHub CI result remains unverified. Planned total **63 checks**. No Apps Script runtime test or deployment, no live Sheets writes; freeze disabled. Next: verify GitHub CI in Actions and test against isolated Apps Script database.


### 2026-11-15 — Reconciliation respects active catalog products

Commit `c8956a07abd2913783f7cd4ba3811b05350d9291` filters ProductIndex by Active=true inside `invBuildLocationComparison_`, matching counting endpoint's active-only reference behavior. Inactive product count rows now appear in invalid diagnostics and their locations red, rather than being treated as valid reconciled inventory. Commit `dc6fc4bb9a082106b034d9ccf30b672da892da15` updates fixture products with Active=true and adds inactive-product rejection case. Commit `a879ae349e4ea64bdb15cd2c8b08fe88e9c9a43f` updates Node runner to 16 fixtures. Re-executed current comparison sources in isolated JavaScript: **26/26 rules + 16/16 fixtures PASS**. Planned automated total **64 checks** (42 map + 22 mocked count). Node CI run remains unverified; Apps Script runtime not tested; no deployment/live data changes; freeze disabled. Next: run/inspect GitHub Actions, then isolated Apps Script integration tests and product import readiness.


### 2026-11-15 — Strict count quantity input validation

Commit `3cc26c475669207e7eb0802911a1bf988cc31e67` rejects quantity coercions (whitespace-only strings, booleans, arrays, exponential-form strings) in `apiInventorySaveCount`, retaining nonnegative safe-integer validation and digit-only numeric strings. Commit `3d8a71861eb0ff4219b6e3b86aef8eb39299a503` adds 5 mocked integration checks, bringing count workflow to **27 scenarios**, plus 42 map assertions = **69 planned checks**. Newly expanded Node suite and GitHub Actions results not yet verified. No Apps Script runtime test, no deployment, no live Sheets writes; freeze disabled. Next: verify CI and Apps Script test database integration; ProductIndex import remains pending.


### 2026-11-15 — Fail closed on duplicate active reference IDs

Commit `60cf9ac9d915c2e0626a213b2a5c47bd27e4d71c` changes count and EMPTY endpoints to require exactly one active location match, and counts to require exactly one active product match; duplicate identifiers now block writes rather than selecting first row. Commit `919f55af325dbebd61cd799468eb387289977918` adds three mocked integration checks for duplicate location count, duplicate location EMPTY, and duplicate product count. Planned suite: **30 mocked workflow checks + 42 comparison assertions = 72**. CI and full Node execution still unverified; Apps Script runtime not tested; no live database changes/deployment. Freeze remains disabled. Next: execute tests, verify CI and perform isolated Apps Script integration, then validate ProductIndex/Locations imports before production use.


### 2026-11-15 — Test harness isolation correction

Commit `f5089331ee6d086b5b982aadafea07944200b644` saves the counting test's mock invUser_/invTeam_/invSession_/invReference_/invRows_/invSheet_ functions and restores them to the Node VM context after loading production `Code.gs`, whose real helper declarations would otherwise override them. This is a test-only change; no app deployment or database writes. Attempted direct GitHub clone for local Node execution, but container DNS could not resolve github.com; a simplified JS simulation was not equivalent to Node VM and did not establish a test result. **Do not claim full 72-check suite passed.** Next: verify GitHub Actions logs or execute Node tests in an environment with repo access; fix any actual failures. Inventory freeze disabled.


### 2026-11-15 — Counting mock test ordering fixed; 30 simulated checks pass

Commit `16ede5fca8677441f4f12117bccc9aa1963c0448` moves the accepted numeric-string count scenario after EMPTY lifecycle and admin-delete assertions. Previously it inserted an active count too early, incorrectly causing the EMPTY-after-deletion test to fail. Re-executed the current test logic against production `Code.gs` in an isolated JavaScript simulation with mocked Apps Script helpers: **30/30 count checks PASS**. This is **not** a native Node VM run or GitHub Actions result; GitHub Actions and Apps Script integration remain unverified. The pure comparison suites last passed 26+16=42 checks, yielding 72 defined checks. No deployment or live data changes. Freeze remains disabled. Next: confirm native Node/GitHub Actions run, then test with isolated Apps Script database.


### 2026-11-15 — Supervisor map detects duplicate active reference IDs

Commit `3af5979f45646b514cb1e99563c08d609f52d3fe` adds duplicate active product and location ID detection in `invBuildLocationComparison_`, matching existing fail-closed counting endpoints. Active entries referencing duplicate product IDs are flagged invalid; duplicate active locations render red and include `duplicateLocation=true`. Commit `26fcda4b9456c5e1e6eb6a37220bc414e4a6171c` adds two fixtures; commit `396411d6302ef85984c52256920e4961202229d8` updates Node runner expected fixture count to 18. Executed latest pure comparison sources in isolated JavaScript: **26/26 rules + 18/18 fixtures PASS**. Total defined suite now **74 checks** (44 map + 30 mocked count). Full native Node/GitHub Actions execution still not verified; no Apps Script runtime/deployment/live database writes. Freeze remains disabled. Next: verify native CI, then test against isolated Apps Script database and import reference data.


### 2026-11-15 — Reject malformed EMPTY rows in supervisor map

Commits `e1e7c5111b8d4251fc9f324b22a4aa7968110125`, `f4cc88f13c16caec0406a638f5a8251ff0b1600b`, `4ecdfe65b59b0a7d61769a6397d2570867dd74fa` require active EMPTY rows to have valid team, blank product ID, blank UOM, and numeric zero quantity; malformed rows are flagged invalid and turn the corresponding location red. Added 4 fixture assertions. Latest pure comparison sources executed in isolated JS: **26 rules + 22 fixtures = 48/48 PASS**. Together with 30 mocked workflow checks, **78 checks defined**. Attempted GitHub workflow lookup on previous main commit; connector returned no runs because it only exposes PR-triggered runs, so GitHub Actions push status remains unverified. No Apps Script deployment or live data changes; freeze disabled. Next: verify native Node/GitHub Actions run and isolated Apps Script integration, then import reference tables.


### 2026-11-15 — Pre-count duplicate reference validation

Commit `cf80abf798e8955ae89ae2954d05a5607fe006ae` reports `duplicateProductIds` and `duplicateLocationIds` in the supervisor comparison, blocks `allGreen` for any duplicate active reference ID even if no count references it, and marks duplicate locations red before counting. Commits `348f93412b2986e4f754e4bb52134d56c68135c9` and `8eb9d4e666567be356f83f892fd6b47690013cf4` add two pure fixtures and adjust Node expected count. Executed current comparison code in isolated JavaScript: **26 rules + 24 fixtures = 50/50 PASS**. Combined with 30 mocked workflow checks, **80 checks defined**. Native Node/GitHub Actions push status and Apps Script runtime remain unverified. No deployment/live sheet writes. Freeze remains disabled. Next priority: run actual Node CI, test against isolated database, and populate Locations/ProductIndex from authoritative sources.


### 2026-11-15 — Blank active reference ID detection

Commits `96ef35d1970b1bb7f8e5ff71f9fb8058d1244d84`, `4d0ea207569226037aca7600b072ed6bb4c684d9`, `a88913fd8489ff2894a98614982063de7fa96c8d` add pre-count blank active ID detection to supervisor comparison (`blankProductIds`, `blankLocationIds`), force blank-ID locations red, and prevent `allGreen` when active catalog identifiers are missing. Two pure fixtures added. Current comparison sources executed in isolated JavaScript: **26 rules + 26 fixtures = 52/52 PASS**; with 30 mocked workflow checks, **82 defined checks**. Full native Node/GitHub Actions run and Apps Script runtime remain unverified. No deployment or live Sheets writes; freeze disabled. Next: verify CI and import actual authoritative reference data into Locations/ProductIndex.


### 2026-11-15 — LIVE Google Sheet reference-table inspection (read-only)

Connected Google Sheets metadata confirms `BMD Inventory — Database` (`12teaGz7z2Ems-Elqz5vHv1Z8S5aV4kJMJrnBxlMYQ5Y`) has the 14 expected tabs. Bounded read `Locations!A1:F1000` found **138 populated location rows**, warehouses **Pulaski** and **Lynnville**, **zero duplicate LocationID values and zero blank IDs**. First ID `PRA-C1-L1`; last `LANE LT`. `ProductIndex!A1:J8` contains **header only**, no products yet. `AppUsers!A1:J8` contains one active administrator provisioned, with no team locked. This supersedes earlier notes implying Locations had not been populated. No writes were made. **Next: identify authoritative SPIRITS packaging and finished-goods sources, map columns, and prepare reviewed ProductIndex import**; do not guess spreadsheet IDs or modify SPIRITS. Native CI and Apps Script runtime unverified; freeze disabled.


### 2026-11-15 — SPIRITS source discovery checkpoint (read-only)

Google Drive keyword searches for `SPIRITS`, `Packaging`, and `Finished Goods` returned many accessible candidate file IDs without reliable titles in connector output; no single authoritative import source can yet be verified from those results. Inspected V4 GitHub handoff `docs/V4_OPTIMIZATION_HANDOFF.md`: it documents separate finished-goods external `FG_SOURCE_` LiveData and raw-material `RM_SOURCE_` LiveData readers, plus internal Brands/Products/Releases/BrandReleaseTypes, but **this is not proof that those tables are the exact SPIRITS product/barcode master**. Do not import from guessed sources or invent barcode/UnitsPerCase values. Next: trace actual V4 source definitions of `FG_SOURCE_`/`RM_SOURCE_` and SPIRITS catalog, inspect verified headers and IDs, produce mapping and preview, and only then write ProductIndex after validation. Locations already populated (138). No live writes/deployments; freeze disabled.


### 2026-11-15 — VERIFIED authoritative WS snapshot sources (read-only)

Traced actual V4 `RawMaterialsSource.gs` and `FinishedGoodsSource.gs` on main. `RM_SOURCE_` points to Google Sheet `1ULhJ2aUGQ9IPO3rkEHzixyNdBvJzU0t2poxLMKSFD8Q`, **Raw Materials Inventory LIVE**, tab `LiveData`; `FG_SOURCE_` points to `15tQfyGJtfAU02JNlf2cV0MY_Pai6F9sVLSl1EMReJMw`, **Finished Good Inventory LIVE**, tab `LiveData`. Google Sheets metadata and bounded `A1:AZ3` reads independently verified both. Raw material columns include `RawMaterialId` (candidate WSItemID), `MaterialName`, `ClassOfMaterial`, `UnitOfMeasure`, `ExternalSKU`, `WarehouseId`, `Units`; V4 filters normalized classes `PACKAGING` and `BLENDINGINGREDIENT`. Finished goods columns include `Master Id` (candidate WSItemID), `Master Name`, `CS`, `BTL`, `Warehouse/Location`, `Timestamp`. **Neither inspected LiveData header has an explicit barcode field; FG has no explicit UnitsPerCase.** Do not mistake raw-material `ExternalSKU` for a verified scan barcode, nor parse FG pack sizes from names without validation. Need verified barcode master, FG case-pack master, active/status rules, and dedup by item ID across warehouse/lot rows before ProductIndex write. Existing ProductIndex remains header-only. No writes/deployment; freeze disabled. Next: locate barcode/pack master source, construct preview with distinct IDs and invalid-row report, then approve and execute import.


### 2026-11-15 — Barcode and pack semantics CONFIRMED BY USER

User explicitly confirmed: **raw-material printed barcode payload equals `RawMaterialId`**; **finished-good printed QR payload equals finished-good name** (WS `Master Name` candidate; exact canonical naming must be validated); bottles-per-case is maintained in **SPIRITS subtype–finished-good relationship**. ProductIndex mapping: raw `WSItemID=RawMaterialId`, `ItemName=MaterialName`, `Barcode=RawMaterialId`; FG `WSItemID=Master Id`, `ItemName=Master Name`, `Barcode=finished-good name`, `UnitsPerCase` from verified subtype/FG relationship. Do not derive from FG name or assume `ExternalSKU` is barcode. V4 `SubtypeSpecifications.gs` verifies `BrandReleaseTypes.UnitsPerCase` and `BrandReleaseTypeID` for subtype specs, but **not yet proven to be the precise subtype–finished-good relation**; inspect SPIRITS/Products/Releases joins and case-pack values before import. ProductIndex remains header-only; no writes/deployment. Next: verify exact joins and uniqueness of finished-good QR name and case-pack, build dry-run mapping report, then import.


### 2026-11-15 — User clarification: SPIRITS planner status is NOT inventory status

User explicitly confirmed SPIRITS subtype `Active/Inactive` status exists **only for visibility in the bottling production planner**. Do NOT filter finished goods or subtypes out of inventory based on that flag. All SPIRITS subtypes, including planner-inactive, are inventory eligible; inventory's own ProductIndex.Active is independent. Bottles-per-case comes from SPIRITS subtype–finished-good relationship, regardless of planner status. Some currently lack this value; user will populate all subtype case packs. Until populated, report missing/invalid UnitsPerCase as a validation issue; do not guess, default to 1, silently drop product, or perform case↔bottle conversion for affected FG. Keep such products discoverable in catalog, with conversion-dependent counts blocked until valid case pack exists. Next: implement/import validation reflecting independent status semantics and test inactive planner subtype and missing pack cases. No live writes/deployments.


### 2026-11-15 — Read-only ProductIndex preview implementation

Added `src/ProductIndexPreview.gs` (`f1600cb2ad84a271db0a6d3c770e77b40acf0264`), a **pure, read-only** mapper accepting raw-material rows, FG rows, and verified case-pack rows. Raw barcode=RawMaterialId, FG QR payload=Master Name, case pack keyed by WSItemID; it does NOT filter by SPIRITS bottling planner status. It deduplicates identical warehouse/lot product rows, reports conflicting IDs, shared barcode payloads and missing/invalid/conflicting case packs, and sets `ready=false` on issues without silently removing FG. Added Node regression file `tests/product-index-preview.test.js` (`fe1a6c3f483df30d376c0b65835745a4789c84fb`), and CI workflow path trigger/test step (`4660388889239ac791905a43f31b4efbddb2a090`). Executed isolated sample mapping successfully; **native Node/GitHub Actions result not verified**. Mapper is not yet connected to a live source-fetch endpoint or any write operation. Next: inspect actual SPIRITS relationship for WS Master Id to UnitsPerCase, validate raw UOM mapping, run preview on real source snapshots, resolve issues, then import with explicit controlled action. No live data writes or deployment; freeze disabled.


### 2026-11-15 — Live V4 subtype/case-pack join verified (read-only)

V4 configured working database ID confirmed from `BMD-V4-Backend/Code.gs`: `1fll-r__z9DWWehswc-eaOyYMuO2zdFoWzksNqAtIZj8` (`BMD V4 — Database`). Live metadata and bounded reads `Products!A1:O500`, `BrandReleaseTypes!A1:O500` verified `Products.SubtypeID -> BrandReleaseTypes.BrandReleaseTypeID`. Products contains `WSFinishedGoodsID`, `WSFinishedGoodName`, `UnitsPerCase`, `Status`; subtype contains `UnitsPerCase`, `Status`. Read-only audit: **231 products, 104 subtypes, 228 matched subtype IDs, 3 unmatched products, 9 product-vs-subtype case-pack differences, 155 linked products with planner-inactive subtype**. These are counts of this snapshot, not yet complete ProductIndex import coverage against FG LiveData. Example conflicts: BYO Clayton James Single Barrel #624/#654/#862 product pack 1 vs blank subtype pack; JYP OTS Barrel Seekers #3729/#3731 product pack 12 vs subtype pack 6. DO NOT use planner status to filter. DO NOT silently choose Product or subtype pack when values disagree; flag conflicts and missing join for review. Next: reconcile all 9 differences, inspect 3 unmatched products and join with FG LiveData Master Id; wire mapper to reviewed case-pack mapping. No live writes/deployments.


### 2026-11-15 — SPIRITS relationship resolver implemented

Added pure read-only `invResolveSpiritsCasePacks_(products,releases,subtypes)` in `src/ProductIndexPreview.gs`, commit `b9ab21ae981df3e159eb516930c94a3516ce17f4`. Resolves direct `Products.SubtypeID` first, then for legacy blank/missing subtype IDs uses `Releases.ProductID -> ReleaseType` matched to `BrandReleaseTypes.BrandID + ReleaseTypeName`; verifies brand ownership; never filters planner-inactive status. Emits verified WS finished-good ID/UnitsPerCase rows or explicit missing, ambiguous, invalid, and conflicting pack issues. Tested isolated inactive BYO release fallback (1 bottle per case) and conflict detection; both behaved as expected. NOT wired to live API, not deployed, no live data writes. Latest bounded connector read still reported nine case-pack discrepancies and three blank Product.SubtypeID values, whereas an earlier read had shown the three populated; treat this as a snapshot inconsistency and verify fresh before any import. SPIRITS `Dashboard.html` option 1 committed separately as `2429749fb134dea1cf1462e582dca22a77cbd2d3`, not deployed. Next: add regression test for resolver to CI and run actual live-source preview after source reads are consistent.


### 2026-11-16 — ProductIndex initial import preparation

Committed pure import gate `src/ProductIndexImportGuard.gs` (`e37b3d9`) and test file `tests/product-index-import-guard.test.js` (`7854e85`). Gate fails closed without explicit token, refuses nonempty targets, preserves FG case packs and raw legacy UOMs, and verifies all nine columns after hypothetical write. This is **not** an admin-authorized writer or a live import; no data changed. Tests added but not yet executed in actual Node/CI. Outstanding: source revalidation adapter, admin-only RPC, lock/stage/rollback, failure-injection and performance logs, test verification and approval before import.


## 2026-11-16 — Live ProductIndex preview UI (post first Apps Script deployment)

User verified clasp authentication, first Apps Script deployment version 1, Workspace administrator UI and database location reads. Legacy **Preview source catalog** displayed 937 unique items, 710 missing UOMs, and old collision 112370: that button called old `apiInventoryAdminCatalogPreview`, not the newer ProductIndex engine. Added `src/ProductIndexLivePreview.gs` (`576eae5`) with admin-only fresh reads from verified WS Raw Materials/FG LiveData and SPIRITS Products/Releases/BrandReleaseTypes, case-pack resolver, ProductIndex preview and existing-row diff; **no writes**. Updated `src/Index.html` (`28ac49d`) to expose **Validate ProductIndex sources** separately and relabel old check **Legacy catalog diagnostic**. Inline UI JS syntax parsed successfully; **live endpoint has not been deployed or tested**. Next: user `git pull`, `clasp push`, deploy a new version/update deployment, run new validation and compare to expected 748 (520 raw, 228 FG, 228 verified packs, zero issues). If source data changed, investigate; do not force expected counts. Import remains unapproved and unimplemented. Beware `clasp pull` creates duplicate .js files alongside tracked .gs files; do not use it in source repo. `.clasp.json` is local and untracked.


## 2026-11-16 — Deployed commit badge and Stats for Nerds

User requested SPIRITS/V4-style Git commit version at top right and bottom-left Stats for Nerds performance monitor before next deployment. Updated `src/Index.html` (`9bcc29e`) with version badge, bounded 500-line in-memory RPC/action log, RPC timing/status, Copy Results/Clear/Close, and browser click events. Added `.gitignore` (`5c1b2d4`) for local `.clasp.json`, generated `src/BuildInfo.gs`, and duplicate `src/*.js` created by clasp pull. Added `scripts/stamp-build.cmd` (`93a018a`) to generate the server endpoint `apiInventoryBuildInfo()` from the local Git HEAD before clasp push; generated file is not committed, but clasp includes it because `rootDir=src`. Run in CMD: `git pull origin main`, `scripts\stamp-build.cmd`, `clasp status`, `clasp push`, then update the existing Web App deployment to a new version. **Do not run clasp pull** in the source checkout. No live deployment/test yet; no database writes. Check browser Stats for Nerds, version stamp, RPC success/errors, and new ProductIndex preview after deployment. Current monitor measures browser-observed RPC latency (network + Apps Script) and click events, not granular server phases.


## 2026-11-16 — Version display verified; ProductIndex CI strengthened

User confirmed the deployed Inventory Web App now displays the Git commit after successful local stamp `2bc629ef`, 15-file clasp status and deployment. Fixed Windows stamp script in commits `ae7d14f` and `2bc629e`. Added `tests/product-index-import-guard.test.js` to GitHub Actions test execution and added `src/ProductIndexLivePreview.gs` / `src/ProductIndexImportGuard.gs` to workflow change triggers (`0071d0e`). **Next user action:** in the deployed administrator panel click **Validate ProductIndex sources** and share its results and Stats for Nerds RPC timing. Expected prior source baseline: 748 total (520 raw + 228 FG), 228 verified case packs, zero issues, 748 adds if ProductIndex still empty. Fresh sources may differ; investigate rather than force baseline. No live ProductIndex import approved or performed. GitHub CI result not yet verified; latest workflow changes not deployed and do not require an Apps Script deployment.


## 2026-11-16 — LIVE ProductIndex preview READY FOR REVIEW

User ran deployed administrator `Validate ProductIndex sources`: **READY FOR REVIEW**, 748 products (520 raw, 228 finished goods), 228 verified case packs, 748 adds, 0 updates, 0 unchanged, 0 missing, **0 issues**, server elapsed **9502ms**. Browser INV_PERF RPC duration **11951ms** (includes transport/queue). **No import performed.** Legacy SPIRITS-only catalog diagnostic is not authoritative for ProductIndex and its missing-UOM warnings must not block this validated preview. Next: develop/test guarded initial import with fresh revalidation, locking, staging/rollback, readback, and failure injection; require explicit user approval before live ProductIndex writes. Optimize source reads separately after phase timings; don't weaken validation.


## 2026-11-16 — Developer diagnostics phase 1 implemented (not yet deployed)

Implemented two approved improvements on main: `src/ProductIndexLivePreview.gs` (`3e74923`) now returns server-side `phases` timings for WS raw/FG reads, SPIRITS Products/Releases/Subtypes reads, case-pack resolver, ProductIndex validation, target read and diff; `src/Index.html` (`1fdb5fc`, `49f41c7`) logs SERVER phase entries in Stats for Nerds, shows phases in validation results, and adds **Copy Diagnostic Report** combining deployed version, browser RPC/action log, latest ProductIndex ready/counts/issues, server total and phase timings. Both files passed JavaScript parse check via `new Function`; **browser integration and GitHub Actions remain unverified**. No database writes, no ProductIndex import, no deployment performed. Next user deploy: `git pull origin main`, `scripts\stamp-build.cmd`, `clasp push`, update existing Web App deployment to New version; rerun ProductIndex preview and send Copy Diagnostic Report. Beware each documentation commit changes Git HEAD, so always stamp after the final pull.


## 2026-11-16 — Inventory GitHub Actions deployment workflow staged

User confirmed the production workbook is now named **SPIRITS** (formerly V4). Reviewed SPIRITS repo `BMD-V4-Backend/.github/workflows/deploy-v4.yml` as reference. Created Inventory `.github/workflows/deploy-inventory.yml` commit `68c2ff83` with manual `workflow_dispatch` only until credentials are configured and first deployment verified. Workflow runs seven regression suites, builds `deploy/` from `src/*.gs`, `src/*.html`, `src/appsscript.json`, stamps `BuildInfo.gs` from GitHub SHA, authenticates clasp, pushes and redeploys existing Web App version. Required repository Actions secrets: `CLASP_CREDENTIALS` (valid JSON token for Apps Script account; may reuse SPIRITS credential value securely), `INVENTORY_APPS_SCRIPT_ID` (Inventory script ID, not SPIRITS), `INVENTORY_WEBAPP_DEPLOYMENT_ID` (Inventory existing deployment ID). Connector cannot read or set GitHub secrets; user must configure these once in Inventory repo Settings > Secrets and variables > Actions. **Not deployed yet; no evidence secrets exist or workflow succeeded.** After first manual workflow success and user confirms version in Web App, enable auto-deploy on main (prefer code-path triggers, not documentation) to avoid failed Actions while unconfigured. Do not copy SPIRITS script/deployment IDs or expose credentials in GitHub. ProductIndex import remains unauthorized.


## 2026-11-16 — First GitHub deployment attempt and source-count fix

User configured all three Inventory GitHub Actions secrets and manually triggered Deploy Inventory Web App #1 (run `43918767883`). All seven regression test commands passed. Job failed at `Prepare versioned Apps Script source` **before clasp push/redeploy** because workflow expected >=14 `.gs`/`.html` files, but repository `src/` contains exactly 13. Corrected threshold to >=13 in commit `3d8fbe5a` on `main`. **No successful deployment yet**. Next: user must start a NEW `workflow_dispatch` run on `main` (rerunning old failed job uses old SHA and will repeat failure); inspect run, fix subsequent errors, then verify Web App commit badge and enable automatic main deployments after successful first run. Secrets were populated in job environment but values not inspected. ProductIndex import remains unauthorized.


## 2026-11-16 — Automated Inventory deployment working

GitHub Actions deployment #2, run `43919121922`, succeeded on commit `45e9d304`: all seven regression suites passed; `clasp push --force` pushed 15 files (including generated BuildInfo.gs and appsscript.json), `clasp version` created version 3, and `clasp redeploy` updated the existing Inventory Web App deployment to version 3. User provided green run screenshot; GitHub job logs independently confirm. Enabled automatic push-to-main deployment for `src/**`, `tests/**`, and deployment workflow changes in commit `9feebf4c`. Workflow retains manual dispatch, serial concurrency, regression tests, and secure GitHub secrets. The auto-enable commit itself triggers a follow-up deployment; inspect its result. Docs-only changes do not trigger deployment. No ProductIndex import performed. User should refresh Web App and verify version badge matches most recently successful deployment SHA; if it doesn't, inspect workflow and caching.


## 2026-11-16 — ProductIndex protected import preparation, staging only

User provided live diagnostic on deployed `9feebf4c`: preview READY, 748 products (520 raw, 228 FG), 228 verified packs, 0 issues, server 3217ms, browser RPC 5978ms; WS FG read 1128ms, WS raw 716ms, SPIRITS products 621ms. Agreed to keep reads fresh and prioritize protected initial import. Added pure read-only `invStageInitialProductIndex_` and `invVerifyStagedProductIndex_` in `src/ProductIndexImportGuard.gs` (commit `8dd5b907`), with negative tests in `tests/product-index-import-guard.test.js` (commit `d5831c12`). Staging checks existing initial-import guard, preserves all nine fields, and rejects row-count, header, and cell readback mismatches. **No server-side writer or public import endpoint, no ProductIndex import, no live data mutation.** Automatic deployment/tests triggered; inspect run results before claiming success. Next implement lock-protected fresh source revalidation and durable backup/staging/audit/rollback with failure injection tests; keep actual import disabled until user separately explicitly authorizes it. Do not infer that a pure staging plan is a transaction or rollback implementation.


## 2026-11-16 — Locked read-only initial import preflight

Confirmed previous staging commit `d5831c12` deployed successfully. Refactored fresh WS/SPIRITS/ProductIndex read and diff into `invProductIndexFreshPlan_` in `src/ProductIndexLivePreview.gs` (commit `4ac02ac3`) while preserving the existing admin preview response shape and phase timings. Added `src/ProductIndexImportPreflight.gs` (commit `0af3cf17`): admin-only `apiInventoryAdminProductIndexImportPreflight` acquires `LockService.getScriptLock()` with 15-second tryLock, re-reads all three source spreadsheets and ProductIndex under lock, runs existing initial-import staging guard, returns only dry-run counts/issues/timings, and releases lock in `finally`. There is **no writer**, no import approval endpoint, and no persistent mutation. Added mocked lock/preflight tests in commit `ee9c63a4`. Auto CI/deploy queued; verify outcomes. Next: plan durable backup/audit/recovery strategy, avoid adding any production writer until explicitly authorized by user. Note: the preflight internally supplies the guard's test token solely to evaluate readiness; it is not a user authorization and cannot write. No ProductIndex import performed.


## 2026-11-16 — ProductIndex recovery assessment, no writes

Confirmed previous locked preflight `ee9c63a4` deployed and tested successfully. Added `src/ProductIndexRecovery.gs` commit `cf0c5bcf`: pure `invAssessInitialProductIndexRecovery_` distinguishes EMPTY, MATCHES_STAGE, REQUIRES_RECOVERY, BLOCKED, detects missing, foreign, altered and duplicate records, and refuses automatic retry on nonempty targets. A supplied journal reference alone never authorizes rollback; durable backup and operator review are still required. Added pure validated audit event factory for PREPARED, BACKUP_VERIFIED, WRITE_STARTED, WRITE_VERIFIED, FAILED, RECOVERY_REQUIRED and RECOVERED; it does not persist audit records. Expanded tests in `tests/product-index-import-guard.test.js` commit `aadaec23`. CI/deploy triggered; check final status. **No backup creation, persistent audit journal, rollback executor, import writer or public import action exists. No ProductIndex data imported.** Next implement durable backup/audit and failure injection in a nonproduction mocked adapter; do not activate production write without separate explicit user approval.


## 2026-11-16 — Stage 4 mock transaction and failure injection

Confirmed `aadaec23` automated deployment and tests successful. Added `src/ProductIndexTransactionSimulator.gs` in `db6471e1`: dependency-injected, non-RPC mock transaction harness with backup-before-write, durable-backup acknowledgment requirement, PREPARED/BACKUP_VERIFIED/WRITE_STARTED/WRITE_VERIFIED audit phases, full staged readback verification and conservative FAILED/RECOVERY_REQUIRED result on write errors. It **never automatically clears partially written rows**. Added tests in `tests/product-index-import-guard.test.js` commit `34a0e2fe` for success, partial write, backup failure, audit failure, and nonempty target. This is a **simulation only**: no production SpreadsheetApp writer, no actual persistent backup or journal, no rollback executor, no import endpoint and no ProductIndex import. CI/deploy pending; check results. Next: ensure production durable backup/audit architecture and explicit approval design before introducing any real write path. Do not mistake simulated backup for real durable backup.


## 2026-11-16 — Stage 5 durable evidence contract (pure, not persisted)

Confirmed Stage 4 `34a0e2fe` CI and automatic deployment success. Added `src/ProductIndexDurableEvidence.gs` commit `ebc4ff17`: fail-closed pure validation of a separately persisted immutable initial-target backup, actor/import ID binding, durable ordered PREPARED/BACKUP_VERIFIED journal, matching backup references, and exact independent readback. Tests for valid evidence and altered/missing/undurable evidence added in `tests/product-index-import-guard.test.js` commit `7328b080`. No actual backup persistence or audit storage adapter exists yet, no live ProductIndex writer, no import RPC, no database mutation. CI/deploy pending; check status. Next choose isolated durable storage strategy (separate restricted Drive backup and append-only journal with readback) and implement its adapter behind a disabled gate, with failure tests and explicit operator approval before any import.


## 2026-11-16 — Stage 6 unexposed Drive evidence adapter

Confirmed `7328b080` tests/deployment successful. Added `src/ProductIndexEvidenceDrive.gs` commit `1a89f401`: internal-only Drive JSON evidence persistence helpers for a future import. They require script property `INV_PRODUCT_INDEX_EVIDENCE_FOLDER_ID`, validate import IDs, refuse duplicate file names, write separate empty-target backup and PREPARED/BACKUP_VERIFIED journal files, independently read them back by file ID, and validate against the pure durable evidence contract. Added mock Drive tests commit `75773b6e` for successful readback, duplicate IDs, and nonempty target. CI/deployment pending verification. **IMPORTANT:** Drive files are not inherently immutable or transactional; `immutable:true` is a logical contract flag, not WORM enforcement. Folder permissions and tamper resistance must be reviewed before live activation. Backup/journal writes are non-atomic, and failure of second file intentionally retains first for manual review. No production RPC invokes this adapter; no evidence files were created in actual Drive, no ProductIndex writer/import, and no database changes. Next harden evidence integrity and independent journal append design, then separately request user approval before enabling any real ProductIndex import.


## 2026-11-16 — Stage 7 audit chain validation

Confirmed Stage 6 commit `75773b6e` CI and deployment success. Added `src/ProductIndexAuditChain.gs` commit `662716da`: pure sequence/identity/predecessor validation and explicit audit state transitions PREPARED -> BACKUP_VERIFIED -> WRITE_STARTED -> WRITE_VERIFIED or FAILED -> RECOVERY_REQUIRED -> RECOVERED. Audit events require unique IDs and predecessor links. Tests added in commit `289a2484` for correct chain, reordering, broken predecessor, duplicate event and invalid transitions. This is **not** cryptographic tamper proofing or a durable append-only file adapter: Drive folder access control and readback remain necessary. No live audit event files, ProductIndex import writer, or import authorization action has been activated. Check CI/deploy for `289a2484`. Next build a write-once per-event Drive persistence adapter, ensure independent readback and concurrency controls, and require explicit approval before actual ProductIndex import.


## 2026-11-16 — Stage 8 private per-event Drive audit adapter

Confirmed `289a2484` CI/deploy successful. Added `src/ProductIndexAuditDrive.gs` commit `ff90bf6e`: private, unexposed per-event Drive JSON persistence, strict contiguous sequence file names, full audit-chain validation on each read, and independent readback after each append. Requires caller-held script lock; Drive is not immutable/WORM and does not prevent edits by privileged users. Tests commit `6947d267` mock append, ordered readback, invalid transition, duplicate event ID and sequence gap. Check CI/deploy. This adapter is NOT wired into an import action or existing legacy journal file; production migration and durable audit integration remain future work. No live Drive files or ProductIndex writes. Next: verify test status; assess race/permissions and cryptographic content integrity; request explicit approval before enabling any actual ProductIndex import.


## 2026-11-16 — Stage 9 SHA-256 evidence integrity

Confirmed Stage 8 `6947d267` tests and deployment succeeded. Added `src/ProductIndexEvidenceIntegrity.gs` commit `7acbad72` with SHA-256 evidence envelopes using Apps Script Utilities digest. Updated `src/ProductIndexEvidenceDrive.gs` commit `e3dbb9e9` to envelope JSON files and verify hashes on every readback. Expanded mocked tests commit `d4c1cd3d` with digest verification and tampered Drive file rejection. Check CI and deploy. Integrity hash detects content changes **only if attacker cannot replace both content and hash**; Drive permissions, independent trusted digest anchoring, concurrency and actual durable journaling integration still need review. No live Drive files, no import RPC, no ProductIndex writer, and no database changes.


## 2026-11-16 — Stage 10 access policy and Drive collision checks

Confirmed Stage 9 `d4c1cd3d` CI and deployment success. Updated `src/ProductIndexEvidenceDrive.gs` commit `dbaf667b` to detect post-creation duplicate filename races; it throws and retains evidence for investigation instead of deleting anything. Added pure fail-closed `src/ProductIndexEvidenceAccessPolicy.gs` commit `3de8caff` to reject broad public/domain/group permissions, missing owner or incomplete permission inspection. Tests commit `8ee87243` cover broad permissions and concurrent duplicate filename creation. **Access policy is not wired to a real Drive permission inspector; it does not claim actual folder permissions have been inspected.** No production import path or live Drive files. CI/deploy check pending. Next: implement read-only permission inspection (requires Drive API permission visibility) and explicitly review folder ownership before any import authorization.


## 2026-11-16 — Stage 11 read-only folder permission inspection

Confirmed Stage 10 `8ee87243` tests/deployment successful. Added private `src/ProductIndexEvidencePermissionInspection.gs` commit `90bd33f7` for Advanced Drive Permissions.list read-only pagination, feeding the existing fail-closed access policy. It **always returns ready:false**, even for owner-only ACLs, until an administrator reviews inherited/shared-drive permissions; missing Drive advanced service, incomplete listings and API errors also fail closed. Added mocked tests commit `a26e1980` for missing API, owner-only, public permission, and API failure. Check CI/deploy. No real folder ID configured or permission inspection executed, no Drive files created, no ProductIndex writer/import. Next: design explicit approval gate and resolve inherited permission/Drive service setup, without activating writes.


## 2026-11-16 — Stage 12 pure import authorization review checklist

Confirmed Stage 11 `a26e1980` CI and deployment success. Added `src/ProductIndexImportAuthorizationReview.gs` commit `63cea4fb`: pure fail-closed checklist requiring admin identity, fresh successful empty-target preflight, staged rows, verified source fingerprint, backup/audit verification, folder permission and inherited-access review, exclusive lock, operator risk acknowledgment, and separately recorded explicit approval. It **always** returns `importEnabled:false`, including if every flag is true: it cannot approve or execute an import. Tests commit `04c6c669` cover passing checklist with disabled import, nonempty target, missing inherited review, missing approval and null input. This is a specification, not a wired endpoint or real approval workflow; inputs are not trusted attestations. No ProductIndex import or Drive evidence writes. Next: inspect test/deploy and plan independently verifiable approval and fresh source fingerprints without exposing a writer until user explicitly authorizes import.


## 2026-11-16 — Stage 13 deterministic staged ProductIndex fingerprint

Confirmed Stage 12 `04c6c669` CI/deployment successful. Added pure `src/ProductIndexStageFingerprint.gs` commit `d866fd4d`: SHA-256 over canonical JSON of staged headers, ordered rows and count; verification fails closed on changed/missing/invalid fingerprint. Tests commit `9316eb07` cover unchanged, changed, reordered, missing fingerprint and invalid count. **Important distinction:** this verifies staged output equality, not every byte of raw WS/SPIRITS source snapshots; source-specific fingerprints and fresh lock-held rereads remain required before any eventual import. No import writer, live Drive writes or ProductIndex mutation. Check CI/deploy. Next integrate fingerprint into read-only preflight result and test it, keeping import disabled.


## 2026-11-16 — Stage 14 five-source fingerprints in read-only preflight

Confirmed Stage 13 `9316eb07` CI/deploy success. Added `src/ProductIndexSourceFingerprint.gs` commit `48fe82aa` with SHA-256 fingerprints of all five normalized source row datasets (WS raw, WS finished goods, SPIRITS Products, Releases, BrandReleaseTypes). Integrated source fingerprints into fresh source plan commit `aed0b292`; read-only admin preflight now returns both source fingerprints and stage fingerprint when ready (commit `5c18b612`). Mock tests commit `cd9c638e` detect changed/missing source rows. **Scope:** these hashes cover normalized, nonblank source records after display-value conversion; they do not cover unused columns, source formatting, blank rows, or original raw sheet bytes. Preflight is still read-only and no import authorization or writer is enabled. Check CI/deploy. Next: compare fresh source fingerprints under lock against a trusted prior snapshot and address the remaining permission/approval workflow.


## Stage 14 CI correction

Initial Stage 14 `cd9c638e` CI and deploy failed because the locked preflight mock did not provide the newly required stage fingerprint helper. Fixed mock dependencies and assertions in `a3fdf584`; CI tests passed. Await latest deployment completion. This was a test-harness failure, not a ProductIndex write. No import or live data changes.


## 2026-11-16 — Stage 15 trusted preflight comparison (pure)

Added `src/ProductIndexTrustedPreflightCompare.gs` commit `1ad5fea6` to compare a freshly validated source plan and stage against independently retained source/stage fingerprints, returning `importEnabled:false` unconditionally. Fresh source snapshots now remain in the private in-memory plan (`c59a5737`), not exposed in the preflight RPC response. Mock tests `8915f27d` cover unchanged, changed source, changed stage and missing trusted fingerprints. **Not wired to an import writer or a public RPC; no trusted fingerprint storage exists yet.** A script lock and trusted external snapshot must be supplied by a future caller. No live ProductIndex or Drive writes. Check latest CI/deploy before declaring complete. Next design a read-only comparison endpoint with explicit caller-supplied trusted fingerprints, bounded validation and lock-held fresh reads, or independently anchored evidence storage; do not implement import without explicit approval.


## 2026-11-16 — Stage 16 admin read-only fingerprint re-verification

Confirmed Stage 15 `8915f27d` CI and deployment success. Added `src/ProductIndexVerifyPreflight.gs` commit `44290f72`: administrator-only read-only endpoint `apiInventoryAdminProductIndexVerifyPreflight(trusted)` reacquires script lock, rereads all five WS/SPIRITS source datasets and ProductIndex, rebuilds staging, compares source and stage fingerprints against caller-retained values, releases lock in finally and always returns `importEnabled:false`. Missing fingerprints return a nonmatching result. Caller-provided fingerprints are **not independently trusted or persisted**, and this endpoint is NOT import authorization. Tests commit `9f054ca7` cover unchanged/changed/missing fingerprints and lock lifecycle. No import writer, ProductIndex mutation or Drive writes. Check CI/deploy. Next improve fingerprint schema validation and test lock contention/exceptions; independent trust/approval and evidence permissions remain unresolved.


## 2026-11-16 — Stage 17 fingerprint schema and fail-closed validation

Confirmed Stage 16 `9f054ca7` CI/deploy success. Hardened `src/ProductIndexSourceFingerprint.gs` (`17f92b3c`) to validate all five expected source table hashes and nonnegative safe counts, compare fields independent of object key order. Hardened `src/ProductIndexTrustedPreflightCompare.gs` (`32101846`) to reject unresolved fresh/staged issues and reuse schema-aware source verifier. Tests `e3b05c93` cover malformed hash/count, reordered table keys and unresolved issues. Check CI/deploy before claiming success. The endpoint remains read-only and caller-provided fingerprints are not trusted authorization; no live import or evidence writes. Next test lock contention, exceptions and malformed inputs at the admin endpoint; consider bounded request size and verified independent fingerprint anchor.


## 2026-11-16 — Stage 18 verification endpoint failure-path hardening

Confirmed Stage 17 `e3b05c93` backend CI and deploy successful. Updated `src/ProductIndexVerifyPreflight.gs` commit `dedef184` to validate five-table source fingerprint schema and staged fingerprint format, count, SHA-256 before acquiring lock; malformed input fails closed without fresh reads. Added mock tests commit `efb61288` for invalid source/stage hashes, script lock contention (no unlock if not acquired), and source read exception (lock always released). Check CI/deploy. This remains an admin-only read-only comparison of caller-supplied hashes, NOT trusted approval. No ProductIndex import or live evidence writes. Next: verify run results; consider independent fingerprint anchoring and explicit approval design before any writer.


## 2026-11-16 — Stage 19 pure preflight anchor record contract

Confirmed Stage 18 `efb61288` CI and deployment successful. Added `src/ProductIndexAnchorRecordContract.gs` commit `e5de00ac` defining an expiring, identity-bound, five-source and staged fingerprint anchor record with empty-target and independent-review fields. This is **structural validation only**: a caller could forge the boolean `independentVerification`; there is no cryptographic signature, independent storage, approval authority, or writer. It always returns `importEnabled:false`. Tests commit `d391c5af` cover valid synthetic record, expiration, not-yet-valid, missing fingerprints, missing review and null record. Check CI/deploy. No ProductIndex or Drive writes. Next plan a genuine independent server-side anchor with access controls and verification rather than trusting client flags; require explicit authorization before enabling evidence persistence or import.


## 2026-11-16 — Stage 20 functional counting workflow: self-service team selection

Moved from ProductIndex security-only stages to Phase 1 functional development. Added `apiInventorySelectTeam` in `src/Code.gs` (`602e23a1`, corrected request validation `f8b2671a`): an authenticated active user can lock Team A/B, must unlock before switching, and team is stored in existing AppUsers columns under script lock. Existing count rows retain their saved team. Added Team A/B selector and Lock/Unlock button in `src/Index.html` (`c96ab978`); counting buttons require locked team. Added mocked team transition tests (`3eaad068`). CI/deploy must be checked. No live user settings or inventory records changed by development; real user team changes occur only when an authorized user explicitly presses the new control. **Outstanding:** admin user-management UI still shows legacy Assigned Team controls; remove or reconcile them to enforce self-service-only policy. UI has not been warehouse-tested. ProductIndex import remains disabled; no live import or Drive evidence writes. Next prioritize actual count UX (location lock, pallet children, corrections), blind ownership and map testing; avoid endless preflight-only stages.


## 2026-11-16 — Stage 21 Phase 1 team permissions and location UX

Confirmed Stage 20 `3eaad068` CI and deployment succeeded. Removed obsolete administrator Assigned Team/Team Locked controls from `src/Index.html` (`c06a2ee4`); admin user upsert in `src/Code.gs` (`cdec4f9e`) now preserves existing team/lock state instead of overriding self-selected teams, including when a legacy request includes team fields. Added temporary client-side location Lock/Unlock (`bb54a2d5`): disables Warehouse/Bay/Location selectors while locked, allows consecutive submissions, no server-side location lock and no Finish Location action. Added mocked admin preservation test (`e18dae56`), verify CI/deploy. No live database changes. Remaining: pallet child submissions, editing constraints, warehouse device testing, UI performance, and ProductIndex import authorization. Note: location lock is deliberately UI-only; other browser tabs can select different locations. Check user-facing team unlock and unsaved form handling before release.


## Stage 21 follow-up CI fixes

Added regression test for admin user updates preserving counter-owned team and lock state (`e18dae56`). CI revealed pre-existing invalid email regex in `apiInventoryAdminUpsertUser`, fixed in `7001526a`. Subsequent CI revealed test mock incorrectly modeled AppUsers seven-column writes, fixed in `2509273b`. Await final CI/deployment result. Do not claim warehouse validation. No live data mutation performed.


## 2026-11-16 — Stage 22 count UI validation and retry guardrails

Confirmed Stage 21 final `2509273b` CI and deployment succeeded. Updated `src/Index.html` (`bd59794d`) to reject blank, fractional, non-integer, or unsafe quantity input before an RPC; require locked team/session/location/product for Save and locked team for EMPTY; and restore Save/EMPTY button disabled state from team permissions after success or failure instead of blindly enabling them. Added static UI regression checks in `tests/index-ui-syntax.test.js` (`4c9baebf`) for these guards, team controls, and removal of admin team overrides. Updated server error message in `src/Code.gs` (`1287bb0e`) to reflect self-service team locking. CI/deployment pending verification. No live writes. **Next:** implement pallet entry multiplier and child-count semantics only after checking handbook requirements; ensure per-pallet records remain independently auditable, and add realistic end-to-end mocked tests. Also verify phone barcode scanning, location map and warehouse flows before production.


## 2026-11-16 — Stage 23 pallet family planning, read-only preview

Confirmed Stage 22 `1287bb0e` CI and deployment passed. Added pure `src/PalletChildPlanner.gs` (`56b3d190`) to expand default-one full pallet, optional partial cases and loose bottles into deterministic parent-suffixed child records, with A..Z, AA.. rollover, validation and safe bounds. Parent is metadata only; bottles are not multiplied. Added mocked planner tests (`84e23859`) and CI job wiring (`abc03519`); planner tests passed in CI at `abc03519`. Added explicitly **preview-only** finished-goods pallet controls (`0628461d`) and UI assertions (`321e052c`). **Do not confuse preview with saving:** existing Save still persists one ordinary count; multi-pallet batch persistence is NOT wired and should not be enabled until atomic/idempotent family retry and recovery are tested. No live inventory data writes. Next implement robust private batched family persistence and mock recovery under script lock, then wire UI only after testing and ownership checks. Verify latest CI and deployment.


## 2026-11-16 — Stage 24 pallet family recovery safety

Confirmed Stage 23 `321e052c` tests and deployment passed. Added pure `src/PalletFamilyRecovery.gs` (`a5f71343`) to classify parent-child pallet families as EMPTY, COMPLETE, PARTIAL or BLOCKED, rejecting duplicates, unexpected children, changed quantity/UOM, deleted child or parent mismatch. PARTIAL deliberately disallows blind append because Google Sheets batch writes are not transactional; safe recovery must be designed before enabling live multi-pallet persistence. Added recovery fixture tests (`618e3402`) and CI workflow coverage (`70634134`), with CI passing for `70634134`. Found and fixed a dangerous UX ambiguity: the Stage 23 preview could show multiple pallets while Save wrote only one row. `src/Index.html` now blocks Save when full-pallet multiplier differs from 1 or partial cases/loose bottles are specified (`03698967`); static regression assertion (`2759f819`). Existing single-row Save remains available for a simple one-pallet case count. Latest CI/deploy pending. No live inventory writes or ProductIndex import. Next implement idempotent family persistence with server-side identity/product/location/session validation, immutable request fingerprint, recovery protocol, one locked batch write, tests for interrupted writes and collisions, and only then enable UI.


## 2026-11-16 — Stage 25 private pallet family batch persistence

Confirmed Stage 24 `2759f819` CI/deployment successful. Strengthened `src/PalletFamilyRecovery.gs` (`ba69e9d3`) to check immutable session, location, product, team, creator, method and notes on idempotent retries, not just child quantity/UOM/parent. Added **private only** `invSavePalletFamilyPrivate_` in `src/PalletFamilyPersistence.gs` (`e781d697`): server-derived user/team, open session and active location/product validation, FG case pack check, script lock, complete-family duplicate detection, conflict/partial fail-closed, EMPTY conflict check, one rectangular batch write for all children, shared parent metadata in ParentEntryID. Does not expose an RPC or wire UI; **live multi-pallet save remains disabled**. Added mock tests (`f49c088d`, expectation fix `e451ca0f`) for seven children, one write, duplicate retry, changed payload, partial family, write exception, lock contention, and lock release; CI wiring `ef1db145`. Mock test passed in CI on `e451ca0f`; check final CI/deploy for `ef1db145`. Caveat: Google Sheets writes are not transactional; partial family is blocked for administrator recovery, not automatically repaired. Additional safety before enabling live: independent family request digest/intent ledger for altered payloads, concurrency/performance testing, review whether default-one preview should be replaced by batch UI, and verify permission isolation. No live ProductIndex or inventory data writes during development.


## 2026-11-16 — Stage 26 post-write family verification

Confirmed Stage 25 `ef1db145` backend tests passed and preceding deployment `e451ca0f` passed. Updated private `src/PalletFamilyPersistence.gs` (`674ff674`) to reread `CountEntries` while still holding script lock and verify the complete family after the single rectangular write, before returning success. Acknowledged-but-partial writes now raise a fail-closed error and a retry with the same parent is classified PARTIAL, not appended. Extended mocked tests (`7bd75d83`) to simulate a Sheets write that returns successfully after writing only two children. Initial CI failure was only an overescaped test regex; corrected in `c4730b55`. Verify CI/deployment before claiming final success. Private writer is NOT a public RPC and multi-pallet Save remains disabled; no live inventory writes. Next: add admin-only read-only family diagnostics, immutable intent evidence to distinguish modified payloads from incomplete writes, and real Apps Script latency/permission tests before UI activation.


## 2026-11-16 — Stage 27 administrator pallet family diagnostics

Confirmed Stage 26 `c4730b55` CI and deployment succeeded. Added `src/PalletFamilyDiagnostics.gs` (`3a45956d`) with administrator-only, read-only `apiInventoryAdminPalletFamilyInspect({parentSubmissionId,sessionId})`. It locks during inspection, scopes by parent/session, caps rows at 200, checks duplicate IDs/suffixes, parent linkage, session/team/location/product/creator consistency, quantity/UOM/multiplier and active status, and returns aggregate cases/bottles and issue codes. No repair, delete, or write. **Important limitation:** a structurally valid observed family cannot prove that no children are missing without a trusted original intent record; endpoint explicitly returns `intentVerified:false`. Added isolated tests (`625c30ad`) for permissions, missing family, aggregates, duplicate IDs, cross-team conflict, inactive child and lock contention. CI workflow updated (`96b8663a`). Check final CI/deploy. Private pallet batch writer remains unexposed; employee Save still blocks multi-child preview. No live inventory records modified during development. Next design immutable server-side intent journal and safe reconciliation, then enable verified UI only after role and warehouse tests.


## 2026-11-16 — Stage 28 canonical pallet intent contract (pure)

Confirmed Stage 27 `96b8663a` CI passed; Stage 27 preceding deployment `625c30ad` passed. Added `src/PalletIntentContract.gs` (`12243b63`) defining a deterministic server-derived submission intent including authenticated creator/team, session, location, product, method, notes, parent ID, ordered child IDs/types/quantities and totals. It uses the existing child planner and exact canonical comparison; tests (`ae385f56`) detect changed quantities, location/product, notes, method, creator and team, and reject invalid inputs. CI wired (`78fcbc96`); tests passed on `ae385f56`, check latest CI. **Critical distinction:** this is a pure intent contract only, not immutable storage, not a cryptographic signature, not an RPC and not proof of original submitted intent. Before live pallet saves, implement a server-owned append-only intent journal with write-before-children protocol, retry/partial recovery, reconciliation, ownership and permission tests. No live inventory data writes or ProductIndex import. Employee multi-pallet Save remains disabled.


## 2026-11-16 — Stage 29 write-ahead pallet intent journal protocol

Confirmed Stage 28 `78fcbc96` CI passed and preceding deployment `ae385f56` passed. Added pure `src/PalletIntentJournalProtocol.gs` (`64cf0450`) implementing first-submission WRITE_INTENT, retry INSPECT_CHILDREN, and BLOCK decisions for duplicate journal rows, malformed stored JSON, changed intent (including authenticated creator/team), or unknown status. Reconciliation against the original canonical intent acknowledges complete families, allows child writes only when no children exist, and blocks partial/conflicting families for administrator review. Added mocked protocol tests (`3da7ad2b`) and CI wiring (`564a901e`). **Not yet a persistent journal:** no new Google Sheets tab/schema, no write-ahead storage, no live mutation, no public RPC, and no UI enablement. Next stage must provision and test server-owned append-only PalletSubmissionJournal schema (explicitly separate from ProductIndex import), validate journal write-before-children and commit transition, then integrate with private writer and diagnostics. Check latest CI/deploy. No live inventory records modified.


## 2026-11-16 — Stage 30 append-only pallet journal storage adapter (not provisioned)

Confirmed Stage 29 `564a901e` tests passed and preceding deployment `3da7ad2b` succeeded. Added `src/PalletIntentJournalStorage.gs` (`c0884987`) with explicit `PalletSubmissionJournal` schema: ParentSubmissionID, SessionID, IntentJSON, Status, CreatedAt, CreatedBy. Under a caller-held script lock, `invPalletJournalPrepare_` reads/validates headers, rejects changed or duplicate intents, appends a PREPARED row once, and rereads to verify persistence before any child write. Retry never overwrites original IntentJSON. `invPalletJournalStatus_` derives COMPLETE/PREPARED/REVIEW_REQUIRED from the immutable intent and actual child rows; no in-place commit marker is needed. Mock tests (`5a6a20da`) cover first append, idempotent retry, altered intent, structural schema mismatch, unacknowledged journal write, and child reconciliation. CI wired (`87781cfb`). **Critical:** The actual Google Sheets journal tab has NOT been created, adapter is NOT wired into private pallet writer, and no employee RPC/UI is enabled. No live inventory or ProductIndex writes. Before enabling: provision journal tab safely with administrator approval, integrate write-ahead journal in private writer, reject orphan children and duplicate parent IDs, test live permissions and performance, ensure privacy controls. Check latest CI/deploy.


## 2026-11-16 — Stage 31 journal-gated private pallet writer

Confirmed Stage 30 `87781cfb` CI passed and `5a6a20da` deployment succeeded. Integrated journal protocol into private `invSavePalletFamilyPrivate_` (`9f825569`): canonical server-derived intent, immutable journal comparison, orphan-family rejection if children exist without journal, verified PREPARED journal append before physical children, and final derived COMPLETE check after child verification. Updated mocked private writer test harness to simulate journal records and protocol (`070046a8`). **No journal tab has been provisioned in the live database**; calling this private function now requires PalletSubmissionJournal and will fail closed if missing. No public save RPC or employee UI change. No ProductIndex import or live inventory writes. Check CI/deployment for `070046a8` and fix any failures. Next test orphan children, altered intent on equal child quantities, journal write failure, and permission isolation; only then plan safe journal-tab provisioning and enable live workflow.


### 2026-11-16 — Stage 32 private pallet journal negative-path tests

Commit `21eddf7e` on main adds mock coverage for orphan family rejection after removal of original journal, failed journal prepare with zero child writes, and retry under same parent after failure. Existing Stage 31 correction `c61ade15` has successful backend CI and deployment. Stage 32 CI is not yet confirmed. No live count or journal writes were performed; employee multi-pallet Save stays disabled. Next: CI verification, ownership/permission and collision tests, explicit approval for journal-tab provisioning.


### 2026-11-16 — Stage 33 identity and collision tests

Stage 32 `21eddf7e` CI/deploy verified successful. Commit `e90b5d20` adds mock negative-path coverage for changed authenticated creator, switched team, changed entry method, duplicate journal parent rows, and parent ID collision with physical count. No live data writes; Stage 33 CI/deploy pending check.


## 2026-11-16 — Stage 34 journal storage negative-path tests

Verified Stage 33 `e90b5d20` backend CI and deployment succeeded. Added `tests/pallet-intent-journal-storage.test.js` cases in `6b8c5828` for simulated Sheets append failure, duplicate parent journal rows, malformed stored IntentJSON, unknown journal status, and recovery to a valid PREPARED journal. Assertions ensure rejected writes and BLOCKED reconciliation on corrupt state. Stage 34 CI/deploy must be checked before declaring success. This is mocked storage testing only; live Google Sheets permissions and latency are not verified. No journal tab provisioned, no live inventory records changed, and employee multi-pallet Save remains disabled. Next: verify CI; inspect and test actual server authorization boundaries, and obtain administrator approval before provisioning PalletSubmissionJournal.


## 2026-11-16 — Stage 35 private pallet authorization guards

Verified Stage 34 `6b8c5828` backend CI and automatic deployment both succeeded. Commit `bbda036f` extends private pallet writer mocked regression coverage: unlocked team identity is rejected by invTeam_ before lock/journal/count writes; session access denied by invSession_ is rejected before journal/count writes; retry with authorized session succeeds. These tests do not prove actual live Workspace permissions. Check Stage 35 CI/deployment. No live journal provisioning, inventory data mutation, ProductIndex import or employee multi-pallet Save activation. Next review production invUser_/invTeam_/invSession_ implementation and test actual role/session boundaries, then seek explicit approval before journal tab provisioning.


## 2026-11-16 — Stage 36 production authentication helper regressions

Verified Stage 35 `bbda036f` backend CI and deployment both succeeded. Reviewed real `src/Code.gs` helpers: `invUser_` requires one active AppUsers row and role administrator/counter; `invTeam_` requires A/B and TeamLocked; `invSession_` requires exactly one OPEN InventorySessions row. Note: `invSession_` checks session openness, **not** per-employee session membership; do not describe it as employee-specific authorization. Added actual production-helper VM tests to `tests/count-workflow.test.js` in `f46dcc33`: inactive/duplicate user, invalid role, unlocked/invalid team, closed/missing/duplicate session, and restored valid access. Check Stage 36 CI/deployment; no live database changes, no journal provisioning, no employee multi-pallet UI/RPC. Next evaluate whether employee-specific session restrictions are required by product rules; avoid inventing them. Validate live Workspace identity and latency only with explicit approval.


## 2026-11-16 — Stage 37 read-only journal provisioning decision

Verified Stage 36 `f46dcc33` backend CI and deployment both succeeded. Added pure `src/PalletJournalProvisioningReview.gs` (`482eb6e2`) and mocked decision tests (`7fabf6d5`). It classifies missing tab, correct empty schema, populated tab, mismatched headers and unknown record count; **all states keep canEnable=false** until an explicit later authorization and validation workflow. This is only a pure decision function, not wired to live Sheets, not a live schema audit, and does not create/modify tabs. Check Stage 37 CI/deploy before claiming success. No live inventory writes, no journal provisioning, no public multi-pallet RPC/UI. Next: validate CI, consider a read-only administrator-only live preflight with explicit user approval; never auto-provision or auto-enable.


## 2026-11-16 — Stage 38 administrator-only read-only journal preflight

Verified Stage 37 `7fabf6d5` backend CI and deployment succeeded. Created `src/PalletJournalAdminPreflight.gs` (`75a7116d`) exposing `apiInventoryPalletJournalPreflight` gated by production `invRequireAdmin_`; it reads spreadsheet/tab metadata and journal headers only and delegates to the Stage 37 fail-closed decision. It rejects unexpected extra columns, absent header, malformed header, populated tab, and does not write/provision/enable anything. Mock tests in `tests/pallet-journal-admin-preflight.test.js` (`b0f2e963`) cover counter rejection before spreadsheet access, missing tab, valid empty/populated tab, extra column, bad header and empty header. Check CI/deployment; this is not a live preflight invocation. No live database writes or employee multi-pallet Save. Next verify CI and seek explicit approval before running preflight on live database or creating the journal tab; do not auto-enable batch Save.


## 2026-11-16 — Stage 39 approved live journal tab provisioning

User explicitly authorized creating only `PalletSubmissionJournal` with six required headers in live `BMD Inventory — Database` (`12teaGz7z2Ems-Elqz5vHv1Z8S5aV4kJMJrnBxlMYQ5Y`), preserving existing tabs and keeping employee multi-pallet Save disabled. Google Sheets connector created tab at index 14, sheetId `316256610`, 1000 rows x 6 columns, frozen header. Wrote A1:F1 exactly: `ParentSubmissionID, SessionID, IntentJSON, Status, CreatedAt, CreatedBy`. Verified live metadata shows 15 tabs (14 original plus journal), and A1:F3 contains only the six headers (no data rows). No count records or existing tabs modified. This is live schema provisioning only; NOT an execution of the Apps Script preflight, no live permission/performance test, and no employee RPC/UI activation. Next: test read-only preflight/Apps Script permissions, journal write/read end-to-end only after separate approval for test writes; maintain fail-closed safety and keep multi-pallet Save disabled until approved.


## 2026-11-16 — Stage 40 production-auth preflight regression

Verified Stage 38 `b0f2e963` CI and deployment success. Added `tests/pallet-journal-production-auth.test.js` (`150e6992`), which loads actual production `src/Code.gs` authorization (`invEmail_`, `invUser_`, `invRequireAdmin_`) and the actual read-only journal preflight into a VM with fake Sheets/Session. It asserts active administrator sees empty correct journal as review-only, and counter, inactive, missing email, and invalid role are denied **before spreadsheet access**. Check Stage 40 CI and deploy results; tests are mocks, NOT live Apps Script permission verification. Approved live journal tab remains header-only and employee multi-pallet Save disabled. Next verify CI, and get separate approval before any live journal/count test writes.


## 2026-11-16 — Stage 41 approved live journal single-record storage test

User explicitly approved writing exactly one clearly marked test row to live `PalletSubmissionJournal`, verifying and leaving it for audit, with NO CountEntries writes and no employee Save activation. Google Sheets connector wrote A2:F2: ParentSubmissionID `TEST_ONLY_JOURNAL_20261116_STAGE41`; SessionID `TEST_ONLY_NO_SESSION`; IntentJSON `{\"testOnly\":true,\"marker\":\"TEST_ONLY_JOURNAL_20261116_STAGE41\",\"purpose\":\"Journal storage read/write verification only; no pallet submission; no count children\"}`; Status `TEST_ONLY`; CreatedAt `2026-11-17T02:02:15.017Z`; CreatedBy `SYSTEM_TEST_NO_USER`. Read back A1:F3: exactly six headers, one test row, no third row. The record is deliberately NOT a valid PREPARED pallet intent, cannot be mistaken for a production submission; production code checks parent IDs. Stage 40 `150e6992` CI/deployment succeeded. IMPORTANT: live admin preflight now reports `EXISTING_RECORDS_REVIEW`, not empty-ready; production recovery logic for a real pallet family was NOT executed, and journal storage adapter was NOT invoked in Apps Script. Before any activation, decide how to segregate audit test rows from production journal, verify live Apps Script permissions and writer/recovery with separate authorization for any further writes. No inventory counts modified.


## 2026-11-16 — Stage 42 audit-only journal marker validation

Added pure `src/PalletJournalAuditReview.gs` (`a62edbe9`) and `tests/pallet-journal-audit-review.test.js` (`d977e8a0`). The helper recognizes only the exact approved Stage 41 audit marker, status TEST_ONLY, sentinel session/creator, and exact test-only JSON shape; mismatched or duplicate audit rows require administrator review. It NEVER filters or suppresses rows from production journal storage/reconciliation and never authorizes enabling employee multi-pallet saving (`canEnable:false`). Existing administrator preflight still reports `EXISTING_RECORDS_REVIEW` for a populated journal. Check Stage 42 CI/deployment. No live database edits or extra test rows. Next validate CI and consider read-only live audit review; seek separate approval before additional live writes or activation.


## 2026-11-16 — Stage 43 read-only live audit verification

Verified Stage 42 `d977e8a0` backend CI success; its deployment was still in progress at check (module commit `a62edbe9` deploy succeeded). Read live `BMD Inventory — Database` metadata and `PalletSubmissionJournal!A1:F4` through read-only Google Sheets connector. Confirmed 15 tabs, exact six headers, exactly one journal data row, Stage 41 marker `TEST_ONLY_JOURNAL_20261116_STAGE41`, sentinel session `TEST_ONLY_NO_SESSION`, status `TEST_ONLY`, creator `SYSTEM_TEST_NO_USER`, and expected JSON `testOnly:true` with matching marker and purpose. No additional journal rows; no writes or employee Save activation. This direct connector read does NOT prove the Apps Script journal adapter or private writer/recovery executed in production. Next verify deployment and obtain separate approval before live end-to-end journal or count writes.


## 2026-11-16 — Stage 44 audit coexistence protocol regression

Verified Stage 42 `d977e8a0` CI and deployment succeeded. Added `tests/pallet-journal-audit-coexistence.test.js` (`2dcaf956`) exercising actual production `invPalletJournalDecision_` with the retained Stage 41 audit-only record: unrelated real parent may write intent; PREPARED retry is detected regardless of row ordering; duplicate real parent blocks; attempted reuse of audit marker blocks INTENT_CHANGED; corrupt real-parent JSON blocks. This is isolated VM testing, not a live writer/recovery run; no new live writes or activation. Check Stage 44 CI/deploy. Next: consider live read-only Apps Script permission verification; seek explicit authorization before any further live journal/count writes.


## 2026-11-16 — Stage 45 live-shaped read-only preflight regression

Verified Stage 44 `2dcaf956` backend CI and deployment success. No connected Apps Script execution action was available, so live Apps Script permission execution is NOT verified. Added `tests/pallet-journal-live-shape-preflight.test.js` (`a8a81d82`) using a mock sheet with exact six live headers and retained Stage 41 audit-only row; actual production preflight returns `EXISTING_RECORDS_REVIEW` and `canEnable:false`, audit classifier recognizes one audit-only row and no production journal entries, and a non-admin caller is rejected before any spreadsheet read. Mocked test only; no live database writes, no count changes, no employee multi-pallet Save activation. Check Stage 45 CI/deployment; next live Apps Script execution requires an authorized execution path, and any further journal/count writes require separate user approval.


## 2026-11-16 — Stage 46 admin-only journal audit diagnostic

Verified Stage 45 `a8a81d82` CI and deployment success. Added `src/PalletJournalAdminAuditDiagnostic.gs` (`9a422e15`): `apiInventoryPalletJournalAuditReview()` first enforces `invRequireAdmin_`, invokes existing read-only preflight, refuses to read journal rows for missing/invalid/unknown schema, then uses existing exact Stage 41 audit classifier to report recognized audit rows, tampered audit rows, and other journal rows. Every result has `canEnable:false`; it never modifies records or enables saving. Added mock regression `tests/pallet-journal-admin-audit-diagnostic.test.js` (`c5601e11`) for counter rejection before reads, correct audit row, unrelated row, tampered row, blocked schema. Check CI/deploy. Live Apps Script execution still unverified; no live writes or employee multi-pallet Save activation.


## 2026-11-16 — Stage 47 live admin diagnostic observed; isolated recovery matrix

User executed `testPalletJournalAuditReview()` on Android Apps Script editor and supplied screenshot of execution log: completed without error in ~1 second, output `{\"state\":\"AUDIT_INSPECTED\",\"preflightState\":\"EXISTING_RECORDS_REVIEW\",\"stage41AuditRows\":1,\"tamperedAuditRows\":0,\"otherJournalRows\":0,\"canEnable\":false}`. This verifies live administrator diagnostic read/classification under the executing account, NOT counter rejection or actual private writer/recovery. Stage 46 `c5601e11` CI and deployment both succeeded. Added isolated `tests/pallet-journal-recovery-matrix.test.js` (`a54edd21`) exercising production pure intent, journal and recovery modules with mock children: EMPTY, COMPLETE, PARTIAL, duplicate, unexpected child, quantity/identity mismatch, changed intent, duplicate journal and corrupt JSON. Check CI/deploy. No additional live writes, no CountEntries modifications, employee multi-pallet Save remains disabled. Further live journal/count write tests require separate explicit approval.


## 2026-11-16 — Stage 48 journal storage adapter audit coexistence

Verified Stage 47 `a54edd21` CI and deployment success. Added `tests/pallet-journal-storage-audit-coexistence.test.js` (`6b74bdd5`) loading the actual production storage adapter and intent/journal modules against a simulated sheet initially containing only the exact Stage 41 retained audit record. Confirms read sees audit, unrelated canonical intent is appended once as PREPARED without changing audit, identical retry does not append, changed intent blocks, duplicate real journal rows block. This test does not write to live Sheets or execute the live private writer; employee Save stays disabled. Check Stage 48 CI/deployment. Live administrator audit diagnostic previously returned AUDIT_INSPECTED, one audit, zero production rows, canEnable:false. Separate approval needed for any further live writes.


## 2026-11-16 — Stage 49 integrated private writer + real journal storage mock

Verified Stage 48 `6b74bdd5` CI and deployment success. Added `tests/pallet-writer-storage-integration.test.js` (`4735513e`) loading real production `PalletFamilyPersistence`, `PalletIntentJournalStorage`, intent, planner, journal protocol and recovery modules together with in-memory simulated CountEntries/PalletSubmissionJournal sheets. Exercises one complete family write, one PREPARED journal append, retained audit row, idempotent retry, altered intent refusal, interrupted partial child write and blocked retry without duplicate journal append. Check CI/deployment. This is an isolated test, not a live Apps Script writer invocation. No live database changes or employee multi-pallet Save activation. Separate user approval required before any further live journal/count writes.


## 2026-11-16 — Stage 50 durable PREPARED retry regression

Verified Stage 49 `4735513e` CI and deployment success. Added `tests/pallet-writer-prepared-retry.test.js` (`714daafa`) loading real private pallet writer, real journal storage, canonical intent, recovery and protocol with simulated Sheets. Simulates journal PREPARED append succeeding, then CountEntries child write throwing before persistence; retry with identical parent/intent must reuse original journal, write all children once, then duplicate retry acknowledges without another write; changed intent blocks. Check CI/deployment. Isolated test only: no live journal or count writes, employee multi-pallet Save disabled. Next evaluate whether an authorized isolated staging spreadsheet is needed for true end-to-end Apps Script writer tests; do not run private writer against production without separate explicit approval.


## 2026-11-16 — Stage 51 staging test plan (no writes)

Verified Stage 50 `714daafa` CI and deployment success. Added `docs/PALLET_WRITER_STAGING_PLAN.md` (`1899b92a`) describing an isolated spreadsheet and Apps Script project, synthetic reference rows, exact writer/recovery test matrix, fail-closed checks and evidence requirements. No staging database/project created and no live journal or CountEntries records modified. Production `INV_DB_ID` and employee multi-pallet Save remain unchanged. **Explicit user approval is required** before creating the staging spreadsheet or writing staging test records; never repoint production script to staging. After approval, inspect actual `invReference_`/`invSession_` dependencies and build staging schema safely.


## 2026-11-16 — Stage 52 approved staging database provisioned

User explicitly authorized a separate staging Google Sheets database populated with synthetic test data, forbidding production changes and employee Save activation. Created native `BMD Inventory — Staging`: https://docs.google.com/spreadsheets/d/1EaaGTFahbAdS3QqywFh4yeuXntCjL8ik1kZcQvqq2zo/edit (ID `1EaaGTFahbAdS3QqywFh4yeuXntCjL8ik1kZcQvqq2zo`). Created six tabs with source-matched headers: AppUsers (synthetic `staging-counter@example.invalid`, counter, A, locked), InventorySessions (`STAGING-SESSION-001`, OPEN), Locations (`STAGING-LOC-001`, active), ProductIndex (`STAGING-FG-001`, Finished Good, UnitsPerCase=12, active), CountEntries (headers only), PalletSubmissionJournal (headers only). Verified metadata shows six tabs and bounded reads confirm synthetic user, empty CountEntries and journal. **No staging Apps Script project created yet**; production `INV_DB_ID` unchanged, no production journal/count writes, no employee Save. Next create or configure a separate isolated Apps Script test project and ensure it cannot write production; do not use production deployment or change production constant. Synthetic `.invalid` user cannot authenticate as a real Workspace user, so real Apps Script testing requires an isolated test identity strategy; never weaken production auth.


## 2026-11-16 — Stage 53 isolated Apps Script setup prepared

Added `docs/PALLET_STAGING_APPS_SCRIPT_SETUP.md` (`a0452c0d`), with safe instructions to create a separate Apps Script project, staging-only DB ID, real Workspace identity in staging AppUsers, and a read-only `testStagingIsolationPreflight` verifying ID, sheet parents, identity, open session, synthetic references, and empty staging CountEntries/journal before any writer execution. Production `INV_DB_ID` remains unchanged. No Apps Script project creation tool is connected, so staging script project is NOT yet created and preflight NOT executed. User needs to create separate staging script project (or connect an appropriate Apps Script management capability). No production writes or employee Save activation.


## Stage 55 — Corrected staging Apps Script ID and live read-only connection

User explicitly corrected previous staging Script ID (DISREGARD `1EjNiYDkzurHcw0x_qbjFh9WCsASVG2B5zGjG4g5BKbdKo12X04pwVG_k`). **Correct staging Script ID:** `1M_H1tAwaHvUB-B7q4ahoQ702rF29m7uPx4XjwbHQWdzMCv4pXfdkc2NP`. User ran staging-only `testStagingConnection()` at 8:30:48 PM, execution completed successfully, reporting database `BMD Inventory — Staging`, ID `1EaaGTFahbAdS3QqywFh4yeuXntCjL8ik1kZcQvqq2zo`, tabs AppUsers, InventorySessions, Locations, ProductIndex, CountEntries, PalletSubmissionJournal. This proves read-only access from the separate project, not writer deployment or auth preflight. Next: read-only staging identity/schema checks, then staging-only code installation. Do not modify production `INV_DB_ID`, live production data, or enable employee Save.


## Stage 57 — Staging-only counter authorization configured

Read-only safety preflight executed successfully at 8:39:51 PM: database staging, signedInEmail `abe.flores@bsbco.com`, session/location/product ready, CountEntries 0, PalletSubmissionJournal 0; only activeCounterReady false due to synthetic placeholder. Verified staging `AppUsers!A1:G2` and changed **only** `AppUsers!A2` in staging spreadsheet `1EaaGTFahbAdS3QqywFh4yeuXntCjL8ik1kZcQvqq2zo` from `staging-counter@example.invalid` to `abe.flores@bsbco.com`, preserving counter/active/team A/locked TRUE and other cells. Connector write succeeded and read-back confirmed. Next user reruns `testStagingSafetyPreflight()` in corrected staging Script ID `1M_H1tAwaHvUB-B7q4ahoQ702rF29m7uPx4XjwbHQWdzMCv4pXfdkc2NP`; expect activeCounterReady true. No production writes, no pallet writer run, no employee Save activation.


## Stage 58 — User-verified isolated staging preflight PASS

At 8:41:15–8:41:17 PM, user ran `testStagingSafetyPreflight()` in corrected staging Apps Script project `1M_H1tAwaHvUB-B7q4ahoQ702rF29m7uPx4XjwbHQWdzMCv4pXfdkc2NP`. Execution completed with `{database:'BMD Inventory — Staging',signedInEmail:'abe.flores@bsbco.com',activeCounterReady:true,sessionOpen:true,locationReady:true,productReady:true,countRows:0,journalRows:0}`. Read-only staging preflight PASS. This does NOT yet prove that pallet writer code is installed or isolated. Next inspect actual private writer dependencies in GitHub and prepare staging-only source package; never copy production `INV_DB_ID` unchanged into staging. No production writes, no staging writer invocation, employee Save disabled.


## Stage 59 — Staging-only pallet writer package prepared (not installed)

Created `staging/PalletWriterStaging.gs` at commit `89ffce82` on main. Package contains minimal copied core auth/session/reference helpers, six original pallet planner/contract/protocol/storage/recovery/private writer modules, and a read-only `testStagingWriterCodeLoaded()` function. Staging-only `INV_DB_ID` points to `1EaaGTFahbAdS3QqywFh4yeuXntCjL8ik1kZcQvqq2zo`; `invSheet_` requires `ScriptApp.getScriptId()` equal corrected staging Script ID `1M_H1tAwaHvUB-B7q4ahoQ702rF29m7uPx4XjwbHQWdzMCv4pXfdkc2NP` before any Sheets access. This package is NOT yet copied into Apps Script, NOT run, and NOT production-deployed. Existing staging `Code.gs` read-only tests should be preserved. User on phone can add a new `.gs` file in staging editor and paste package from GitHub raw. Run only read-only `testStagingWriterCodeLoaded` next, inspect logs before any private writer test. Employee multi-pallet Save remains disabled; production unchanged.


## Stage 60 — Isolated staging writer code loaded, read-only test PASS

User ran `testStagingWriterCodeLoaded()` at 9:02:26–9:02:29 PM in staging Apps Script project `1M_H1tAwaHvUB-B7q4ahoQ702rF29m7uPx4XjwbHQWdzMCv4pXfdkc2NP`. Execution completed successfully, logged `{stagingOnly:true,team:'A',sessionOpen:true,locations:1,products:1,journalRows:0,countRows:0,plannedChildren:4}`. This verifies staging-only source package installation and read-only dependency test; no live pallet write has occurred. Next controlled staging-only private writer test, with unique parent ID, expected journal/child counts and readback, preserving production untouched and employee Save disabled. User is on phone; minimize manual scripts.


## Stage 61 — Guarded live staging writer test prepared; awaiting user execution

Created `staging/PalletWriterFirstLiveTest.gs` on GitHub main (commit `c0bf043e`). A single test function `testStagingPalletWriterFirstSave()` enforces corrected staging Script ID and DB, signed-in authorized Team A user, synthetic session/location/product, and blocks unexpected pre-existing records. It invokes the real private writer once for parent `STAGING-LIVE-PALLET-0001` with 2 pallets x 10 cases, 3 partial cases, 2 loose bottles; verifies one immutable PREPARED journal, four children, IDs/quantities, then retries same request and checks idempotency. **Not yet executed or copied to staging project.** User on phone must create new `.gs` file and run function once. After logs, read staging journal and counts via connector. Do not modify production or enable employee Save.


## Stage 62 — Real isolated staging writer PASS and verified sheet readback

User ran `testStagingPalletWriterFirstSave()` at 9:05:12–9:05:16 PM in staging Apps Script. Logs: BEFORE 0 journal/0 counts; FIRST `{ok:true,duplicate:false,parentSubmissionId:'STAGING-LIVE-PALLET-0001',childCount:4,totalCases:23,totalLooseBottles:2}`; PASS 1 journal/4 counts, child quantities [10,10,3,2], retryDuplicate true, execution completed. Independent Google Sheets connector readback of staging `PalletSubmissionJournal!A1:F5` and `CountEntries!A1:N8` confirmed exactly one immutable PREPARED intent and four ACTIVE children, Team A, correct parent/session/location/product, 23 cases + 2 bottles, no duplicate. After completed run user also reported `SyntaxError: Unexpected token '*' line 69 file PalletWriterFirstLiveTest.gs`; likely stray trailing `*/` introduced by phone copy-paste. This error should be repaired separately; it does not negate the completed 9:05 test, but avoid further runs until script syntax is corrected. No production changes, employee Save disabled. Next stage: remaining failure/recovery tests, minimize manual user runs.


## Stage 63 — Pure pallet recovery matrix authored; execution pending

Reviewed actual `src/PalletFamilyRecovery.gs`, `src/PalletIntentJournalProtocol.gs`, `src/PalletIntentJournalStorage.gs`, `src/PalletFamilyPersistence.gs` and intent contract. Committed `staging/PalletRecoveryMatrixStaging.gs` on main (commit `29bfe142`), defining `testStagingPalletRecoveryMatrix()` with 15 synthetic in-memory assertions: first intent, prepared retry, empty, complete, partial (2 cases), duplicate child, altered quantity, parent mismatch, team mismatch, changed intent, duplicate journal, corrupt JSON, unknown status, committed retry. The test calls `invAssertStagingOnly_()` but does not read or write Sheets. **Not yet run**, so don't mark PASS until user executes it in isolated staging project. Existing staging live data (one journal/four children) remains untouched; production and employee Save untouched. Next ask user to paste new `.gs` file and run this one function; then review log and any failure.


## Stage 64 — Clasp staging upload successful, recovery test execution pending

On Windows CMD user cloned isolated staging Apps Script project `1M_H1tAwaHvUB-B7q4ahoQ702rF29m7uPx4XjwbHQWdzMCv4pXfdkc2NP` to `C:\\Users\\amram\\Inventory-Staging` and made separate backup at `C:\\Users\\amram\\Inventory-Staging-Backup`. `.clasp.json` confirmed correct staging script ID, and `clasp status` tracked five files. User saved `PalletRecoveryMatrixStaging.gs` and ran `clasp push`; CLI reported `Pushed 5 files at 7:55:21 AM` (appsscript.json, Code.js, PalletRecoveryMatrixStaging.gs, PalletWriterFirstLiveTest.js, testStagingWriterCodeLoaded.js). **Upload succeeded, but recovery matrix has not yet been executed**. Next run only `testStagingPalletRecoveryMatrix()` in staging Apps Script and inspect 15 PASS cases and `databaseWrites:0`; do not run live writer again. No production changes or employee Save activation. The oversized `testStagingWriterCodeLoaded.js` is 209824 bytes, 421 lines, max line length 1299; investigate formatting later, not a blocker for this upload.


## Stage 65 — Recovery matrix 13 PASS, fixture bugs corrected; awaiting rerun

User ran staging `testStagingPalletRecoveryMatrix()` at 7:58:36 AM. First 13 tests PASS, including corrupted JSON diagnostic `{action:'BLOCK',reason:'INVALID_STORED_INTENT'}`. Test then failed `unknown journal status blocks` due to test fixture spreading the journal array (`{...journal}`) instead of journal record (`{...journal[0]}`); same bug affected final COMMITTED retry test. Fixed both in `staging/PalletRecoveryMatrixStaging.gs` commit `3d714285`. No engine changes, no DB writes. Next user downloads updated GitHub raw into staging local folder, runs `clasp push`, then staging test once; expect all 15 PASS and databaseWrites:0. Production unchanged.


## Stage 63 complete — 2026-11-17, 8:04 AM local

User confirmed staging `clasp push` at 8:03:56 AM (five files). Executed `testStagingPalletRecoveryMatrix()` in isolated staging Apps Script at 8:04:08–8:04:09 AM. **All 15/15 pure in-memory recovery matrix checks PASS**; final log `{"phase":"PASS","stagingOnly":true,"pureInMemory":true,"testCases":15,"databaseWrites":0}`. Diagnostics confirmed invalid stored JSON -> `BLOCK / INVALID_STORED_INTENT`, unknown status -> `BLOCK / UNKNOWN_JOURNAL_STATUS`. No database writes in this test. Earlier real staging first-save/retry test passed with one journal and four children. Production remains untouched. Stage 63 is complete; do not rerun without a regression reason. Next work: plan controlled fault-injection/real interruption staging-only recovery validation before enabling employee Save; continue with app integration and location status map thereafter. Preserve main branch and all three handbooks.


## Stage 66 — Durable journal interruption test prepared (NOT YET RUN)

Created `staging/PalletInterruptedSaveStaging.gs` on main, commit `1aa51f02`. Function `testStagingInterruptedPalletSave()` uses isolated staging guards, authorized Team A, and new synthetic parent `STAGING-INTERRUPT-0001`. It deliberately writes only a PREPARED journal record (under lock) and verifies zero new children, then invokes the existing private writer with the same intent to resume and verify 3 children [7 cases, 2 cases, 1 bottle] and an idempotent retry. This is a **controlled simulation of interruption after durable journal but before child writes**, not an actual process kill or partial child-write injection. It will add 1 journal and 3 count rows to STAGING only when executed. It refuses to run if its parent already exists. **Not yet deployed or executed.** Next user downloads file into `C:\Users\amram\Inventory-Staging`, `clasp push`, runs ONLY `testStagingInterruptedPalletSave`, and shares logs. Do not run production or enable employee Save. Stage 63 15/15 remains complete.


## Stage 66 COMPLETE — 2026-11-17 8:12 AM local

User deployed six files via `clasp push` at 8:10:02 AM to isolated staging Apps Script project. Ran `testStagingInterruptedPalletSave()` at 8:12:11–8:12:18 AM. Log: `{"phase":"INTERRUPTED_AFTER_JOURNAL","journalDelta":1,"countDelta":0}` then `{"phase":"PASS","stagingOnly":true,"interruption":"JOURNAL_ONLY","journalDelta":1,"countDelta":3,"quantities":[7,2,1],"retryDuplicate":true}`. Test completed successfully. This validates simulated interruption after durable journal and before child writes, followed by real staging recovery and duplicate-safe retry. It does **not** validate actual process termination or partial physical child writes; those remain separate scenarios. Staging now has original first-live 1 journal/4 children plus Stage 66 1 journal/3 children (expected totals 2 journal and 7 children if no other writes). Production untouched, employee Save disabled. Do not rerun one-time Stage 66 test. Next consider safe staging-only partial-write fault injection and fail-closed validation, then employee UI integration.


## Stage 67 — Partial physical child-write fail-closed test PREPARED, not run

Added `staging/PalletPartialFailClosedStaging.gs` on main, commit `70850999`. One-time staging-only `testStagingPartialPalletFailClosed()` uses new synthetic parent `STAGING-PARTIAL-0001`, validates staging script/identity/session/references, writes one durable PREPARED journal and exactly one of four child count rows under script lock, then retries the original private writer and asserts error `Pallet family PARTIAL` and `Contact administrator`, no extra journal/count writes, still PARTIAL. This intentionally leaves 1 journal and 1 child for administrator review in staging; do NOT automatically repair or delete. It does not touch production or expose employee Save. Not deployed/run yet. Next user downloads staging file via curl, runs `clasp push`, executes only `testStagingPartialPalletFailClosed` once, sends log. Prior Stage 66 PASS and Stage 63 15/15 PASS; do not repeat.


## Stage 67 PASS — 2026-11-17 8:17 AM local

User executed `testStagingPartialPalletFailClosed` in staging. Actual log: `{"phase":"PARTIAL_CREATED","journalDelta":1,"countDelta":1,"expectedChildren":4}` followed by `{"phase":"PASS","stagingOnly":true,"retryBlocked":true,"reason":"PARTIAL","journalDelta":1,"countDelta":1,"additionalWritesOnRetry":0,"adminReviewRequired":true}`. Execution completed. This confirms one-of-four child partial state is detected and private writer retry fails closed without additional writes. Intentionally incomplete synthetic staging parent `STAGING-PARTIAL-0001` remains for admin review. Do not rerun Stage 67 or delete/repair this test family without explicit review. Production untouched, employee Save disabled. Next: review and plan safe employee UI integration and operational handling for blocked partial families; do not expose save until authorization and end-to-end tests.


## Stage 68 — read-only staging admin inspection PREPARED (not run)

Added `staging/PalletAdminInspectionStaging.gs` commit `e0c2779f` on main. Function `testStagingPartialPalletAdminInspection()` is not a public RPC; it enforces staging-only script/database and administrator role, reads existing synthetic `STAGING-PARTIAL-0001` journal and children, validates immutable intent and reports safe summary of expected 4, observed 1, missing 3, state PARTIAL, journal PREPARED, requires admin review, with `databaseWrites:0`. No mutation or auto repair; production untouched and employee Save disabled. Next user curl downloads file into local staging clasp directory, pushes, executes read-only function once and shares logs. Following successful validation, design employee UI wiring behind explicit feature gate; do not activate production Save.


## Stage 68 correction — staging counter role

User ran `testStagingPartialPalletAdminInspection()` at 8:21:27 AM; it failed immediately `Administrator permission required` from `invRequireAdmin_` before any writes. Staging test identity is authorized locked Team A counter, not admin. Corrected only staging test function in commit 091217af: replace admin requirement with `invUser_()` plus exact authorized staging email and locked Team A guard. Test remains staging-script/database guarded, read-only, non-RPC, and verifies synthetic partial family. No changes to production administrator permissions or data. Test NOT YET rerun. Next user downloads updated file and `clasp push`, reruns inspection, shares log.


## Stage 68 PASS — 2026-11-17 8:25 AM local

User confirmed corrected staging-only `testStagingPartialPalletAdminInspection()` completed at 8:25:07 AM. Actual log: `{"phase":"ADMIN_INSPECTION","stagingOnly":true,"readOnly":true,"testerRole":"counter","parentSubmissionId":"STAGING-PARTIAL-0001","journalCount":1,"journalStatus":"PREPARED","expectedChildren":4,"observedChildren":1,"state":"PARTIAL","matchedCount":1,"missingCount":3,"issueCount":0,"journalDecision":"INSPECT_CHILDREN","adminReviewRequired":true}` then `{"phase":"PASS","stagingOnly":true,"readOnly":true,"partialFamilyConfirmed":true,"databaseWrites":0,"adminReviewRequired":true}`. This is a *staging test diagnostic run by authorized Team A counter*, not a grant of administrator permissions or a production admin UI. Original admin guard caused failure, corrected test-only guard and pinned commit downloaded successfully. No writes. Do not rerun one-time write tests; synthetic partial family remains for future administrator review. Next: build gated employee UI and Team A/B staging end-to-end flow, with production Save disabled pending approval.


## Stage 69 — Employee pallet-family UI integration, disabled control PREPARED

Reviewed current `src/Index.html` and `src/Code.gs`. Existing `Save count` calls `apiInventorySaveCount` for one count and is separate from pallet-family private writer. Added disabled `Save pallet family — not enabled` control to existing finished-goods pallet preview in `src/Index.html` (commit b9c49359). Added explicit warning that normal Save count saves one count only. No new public RPC, no pallet-family backend exposure, no change to production DB or existing single-count behavior. **Not deployed or browser-tested**; UI remains inert. Next: review design and add safe staging-only end-to-end Team A/B tests, verify UI against staging before enabling family Save by explicit approval. Avoid claiming the full integration is complete.


## Stage 70 — Team A/B isolation test PREPARED, NOT RUN

Added `staging/PalletTeamIsolationStaging.gs` on main, commit 3ea6b6ec. Staging-only `testStagingPalletTeamIsolation()` checks locked authorized staging Team A tester, then exercises 10 **pure in-memory** synthetic family classification scenarios for A/B ownership and mismatched session, location, product, identity, partial/empty. No staging DB writes; no real Team B account or end-to-end RPC tested. Must not label this a real two-user integration test. User needs download via curl, `clasp push`, execute function once and share logs. Existing Stage 69 UI disabled control is committed but not deployed. Production and employee family Save unchanged.


## Stage 70 PASS — 2026-11-17 8:49 AM local

User executed `testStagingPalletTeamIsolation()` in isolated staging Apps Script after manually downloading `staging/PalletTeamIsolationStaging.gs` and pushing through staging CLASP. Execution log reports ten PASS classifications (Team A complete, Team B blocked from A, Team B own complete, Team A blocked from B, missing child PARTIAL, no children EMPTY, wrong session/location/product/counter identity BLOCKED). Final JSON: `{"phase":"PASS","stagingOnly":true,"pureInMemory":true,"testCases":10,"databaseWrites":0,"teamAandBIsolation":true}`; execution completed. This verifies synthetic pure in-memory classifier behavior only, not real Team B account, production authorization or end-to-end RPC. Stage 70 complete; do not rerun. Next: design safe automated staging-only sync with explicit staging script ID, production-ID fail-closed checks, preservation of local staging-only files, and no automatic deployment until safety reviewed. Stage 71 remains pending.


## Stage 71 — staging synchronization workflow PREPARED (2026-11-17)

Created manual-only `.github/workflows/sync-inventory-staging.yml` in commit `6e1ff647`. It uses dedicated `INVENTORY_STAGING_CLASP_CREDENTIALS` and `INVENTORY_STAGING_SCRIPT_ID` secrets (not production secrets), asserts the known staging script ID, pulls existing remote staging source, checks staging Code.js contains the expected staging DB ID and that no production DB ID appears, overlays five staging-only test modules, and pushes only after preflight. It does not redeploy production. **NOT RUN OR VERIFIED**. Requires configuring secrets and manually dispatching first run; review resulting CLASP diff and remote-only file preservation before enabling any automatic trigger. Stage 70 PASS recorded previously. Do not claim Stage 71 complete.


## Stage 71 — staging sync manual deployment reported successful; automatic trigger enabled (2026-11-17)

User reported GitHub Actions `Sync Inventory Staging Tests` deployment successful after duplicate `.js`/`.gs` basename fix (commit `cfae1c1e`). Workflow pulls existing remote staging project, overlays five test modules, checks isolated staging script/database and production DB exclusion, then pushes to staging; no main Web App redeploy. Enabled automatic sync on changes to the five staging test modules or workflow itself on main in commit `d921a5ea`; manual dispatch retained. Note: success is user-reported; follow-up Actions run triggered by workflow edit has not yet been independently verified. Only listed test modules auto-sync, not every `staging/` file. No live employee pallet-family Save enabled.


## Stage 72 — pallet-family UI release gate added (2026-11-17)

Added regression assertions to `tests/index-ui-syntax.test.js` commit `bee5d0e2`: employee `savePalletFamily` button must remain disabled and aria-disabled, no client `.apiInventorySavePalletFamily(` call or `Code.gs` public function may be exposed, and the separate single-count Save disclaimer remains visible. Existing CI runs this test through `inventory-tests.yml` and production deploy regression. This is a safety guard, NOT full end-to-end Team A/B staging testing or feature activation. Need verify CI green, then design staging-only authenticated Team A/B end-to-end test using two distinct accounts before enabling the button. Production Save remains disabled.


## Stage 72 — read-only pallet preview/server planner parity (2026-11-17)

Corrected `src/Index.html` in `9aa01411`: preview rejects full pallets without cases-per-pallet, cases-per-pallet without full pallets, unsafe integer totals and empty plans; still permits valid partial/loose-only plans. Added UI regression assertions `5f2f1677`. No new RPC or pallet-family Save activation. Main Web App deployment is manual-only per user request; these commits are NOT deployed. User prefers consolidated testing after substantial feature development, not commit-by-commit verification. Next implement staged authenticated Team A/B end-to-end coverage and safe Save activation plan, retaining fail-closed gating until approval.


## Stage 74 — team EMPTY and interrupted-family isolation regression (2026-11-17)

Commit `13b49dc4` extends `tests/pallet-family-persistence.test.js` with in-memory backend scenarios: Team A's active EMPTY blocks only Team A's pallet family; Team B can independently save in the same session/location; after removal of Team A EMPTY, Team A can save; simulated missing Team B child forces Team B retry to fail PARTIAL without new writes while Team A complete family remains idempotently acknowledged. No real authenticated two-account staging test or live Sheets write; CI not independently verified yet. Main Web App remains manual-deploy only and pallet-family Save disabled. Continue building and testing without requesting user test per commit; consolidate acceptance testing later.


## Stage 75 — pallet retry requires independently verified journal (2026-11-17)

Commit `04552b9c` strengthens `invSavePalletFamilyPrivate_`: a COMPLETE physical family on idempotent retry must also have original journal action INSPECT_CHILDREN and `invPalletJournalStatus_` COMPLETE; otherwise fail closed with administrator-review/error, never report duplicate success. Commit `e2a84782` adds mocked journal-reconciliation failure regression: after initial complete save, journal reconciliation error must reject retry without extra physical writes; restoring journal verification permits duplicate acknowledgement. CI result not yet independently checked. Private writer remains unexposed; employee pallet-family Save disabled; no main Web App deployment. Continue developing and use consolidated user testing per request.


## Stage 79 — stale pallet preview cleared across product changes (2026-11-17)

Commits `c6541269`, `aafc9f07`, `86037bbb` ensure the read-only finished-goods pallet breakdown clears old rows and totals before switching product context, including searches returning no product. `selectUom()` now refreshes the preview when no matching product is selected, and UI assertions protect this behavior. Employee pallet-family Save remains disabled; no public batch-save RPC and no main Web App deployment. Automated test execution has not yet been independently confirmed. Continue towards staging-only authenticated integration and one consolidated user acceptance test.


## Stage 137 — read-only Count B transition preview prepared (2026-11-23)

Commit `e9b90a4` adds `testStagingCountABTransitionPreview()` in `staging/PalletTeamIsolationStaging.gs`. This administrator-only, staging-only read-only diagnostic checks the actual Team A-only baseline and simulates four A/B states in memory: A-only IN_PROGRESS, B one bottle lower MISMATCH, B equal MATCHED, B one bottle higher MISMATCH. It rejects changed live Team B data or unexpected Team A fixtures, never writes CountEntries, and does not enable employee family Save. **Not yet executed in Apps Script; no real Team B write performed.** Next: batch-test the preview after staging sync, then design a separately authorized, idempotent guarded real Team B staging write with clear audit/cleanup rules. Do not modify production or re-run one-time synthetic cleanup.


## Stage 138 — guarded Team B write planning, no writes (2026-11-24)

Commit `290a507d` adds pure `invStagingPlanLiveCountB_()` and read-only administrator test `testStagingLiveCountBWritePlan()` in `staging/PalletTeamIsolationStaging.gs`. It derives Team A's actual bottle-equivalent total, proposes B total minus one for MISMATCH and equal total for MATCHED, and rejects eight unsafe planning scenarios (missing approval, nonstaging, wrong role/scope, invalid pack, empty baseline, existing B entry, unexpected A product). The approval boolean is a **pure fixture only**; no executable writer or authorization has been granted. Stage 137 preview and Stage 138 planner have **not yet been executed in staging Apps Script**. After staging sync green, batch-run both read-only tests, inspect logs, and only then design a separately approved, audited, idempotent real staging B writer. Do not activate employee family Save or touch production.


## Stages 137 and 138 PASS — user-run staging diagnostics (2026-11-24, 7:43 AM)

User ran `testStagingCountABTransitionPreview()` in `PalletTeamIsolationStaging.gs` at 7:43:04–06 AM: `COUNT_AB_TRANSITION_PREVIEW`, `stagingOnly:true`, `readOnly:true`, `databaseWrites:0`, `scenariosPassed:4`, `activeTeamAEntries:7`, `activeTeamBEntries:0`, `teamATotalBottles:387`, `readyForGuardedLiveB:true`, `realTeamBWriteExecuted:false`. User then ran `testStagingLiveCountBWritePlan()` at 7:43:16–18 AM: `COUNT_B_WRITE_PLAN`, `stagingOnly:true`, `readOnly:true`, `databaseWrites:0`, `negativeCasesPassed:8`, `activeTeamAEntries:7`, `proposedMismatchBottles:386`, `proposedMatchBottles:387`, `writeEnabled:false`, `realTeamBWriteExecuted:false`. Both completed. **Next:** develop separately guarded, audited, idempotent live Team B staging writer; do not execute real writes without explicit user authorization. Preserve Team A and production, keep employee Save gated.

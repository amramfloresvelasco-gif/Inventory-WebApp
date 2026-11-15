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

# Investment Hierarchy — New Functions

This document covers the four new server actions (plus one utility) that
complete the proposed investment → commission flow. They live in
`investment-hierarchy.ts` and are designed to drop in alongside your existing
`approveInvestment`, `updateInvestmentHierarchy`, and `processCommissions`
functions with no breaking changes.

---

## Background

### The problem with the current flow

When commission processing runs today, `processCommissions` accepts an optional
`hierarchyEmpNos` parameter. If the caller doesn't supply it, the function falls
back to `getUplineChain`, which does a live DB lookup of everyone in the branch
with a higher rank than the advisor. This means:

- The caller (usually a UI action) has to manually assemble the right employee
  list per investment before calling processCommissions.
- If the wrong branch ID is used, or a member's rank changed since approval,
  the live lookup returns a different set than what was captured at approval.

### The fix

At approval time, `approveInvestment` already writes `faId`, `fmId`, `bmId`,
`rmId`, `zmId`, `agmId`, `ccoId` onto the Investment row. This is the snapshot.
The new functions make that snapshot the **single source of truth** for
commission processing — no manual filtering, no live rebuilding.

---

## Schema migration (one column, optional but recommended)

Add a `hierarchyModified` flag to `Investment` to track when HR manually
overrides the snapshot after approval:

```sql
ALTER TABLE "Investment"
  ADD COLUMN "hierarchyModified" BOOLEAN NOT NULL DEFAULT false;
```

Prisma migration equivalent:

```prisma
model Investment {
  // ... existing fields ...
  hierarchyModified Boolean @default(false)
}
```

Run `npx prisma migrate dev --name add_hierarchy_modified_flag`.

The new functions work **without** this migration — they cast to `any` when
reading/writing the field and fall back to `false` safely. But adding the
column enables the override warning in the commission UI.

---

## Functions

### 1. `getHierarchyEmpNosFromInvestment(investmentId)`

**What it does**

Reads the seven hierarchy member IDs stored on the Investment row and resolves
them to `empNo` strings in a single batched query. Returns them in rank order
(FA → CCO).

**When to call it**

Any time you need to know "who is on this investment's hierarchy" without
rebuilding it from scratch. Used internally by
`processCommissionsFromSavedHierarchy`.

**Return value**

```ts
{
  success: boolean;
  empNos: string[];          // e.g. ["EMP-0696", "EMP-0695", "EMP-0435", ...]
  hierarchyModified: boolean; // true if HR override was applied after approval
  error?: string;
}
```

**Real data example** (Investment 210 from your DB):

| Field | memberId | resolves to |
|-------|----------|-------------|
| faId  | 696      | advisor's empNo |
| fmId  | 695      | FM's empNo |
| bmId  | 691      | BM's empNo |
| rmId  | 435      | RM's empNo |
| agmId | 379      | AGM's empNo |
| ccoId | 432      | CCO's empNo |
| zmId  | null     | (skipped)  |

Returns `empNos` with 6 entries in the order above.

---

### 2. `approveInvestmentWithHierarchyLog(data)`

**What it does**

Identical to the existing `approveInvestment` but adds a structured
`ActivityLog` entry immediately after the transaction commits. The log entry
contains the full hierarchy snapshot so you can always answer "what was the
hierarchy at approval time?" even if it is later overridden.

**When to call it**

Replace all calls to `approveInvestment` with this function. The signature is
identical — no changes needed in the calling component.

**Audit log entry shape**

```json
{
  "event": "hierarchy_snapshot_at_approval",
  "hierarchySnapshot": {
    "faId": 696, "fmId": 695, "bmId": 691,
    "rmId": 435, "zmId": null, "agmId": 379, "ccoId": 432
  },
  "reviewNote": "",
  "approvedAt": "2026-06-17T09:02:03.999Z"
}
```

**Note on `upsertActivationsForInvestment`**

The original `approveInvestment` calls `upsertActivationsForInvestment` inside
the transaction. That helper is not duplicated in this file. Add the import and
call at the marked comment (`// await upsertActivationsForInvestment(...)`) to
match your existing behaviour exactly.

---

### 3. `updateInvestmentHierarchyWithAudit(investmentId, newHierarchy)`

**What it does**

Drop-in replacement for `updateInvestmentHierarchy` with three additions:

1. **Role guard** — Only `ADMIN` and `HR` roles may call this. Anyone else gets
   an error before any DB write occurs.

2. **Audit log** — Writes a before/after snapshot to `ActivityLog` after the
   transaction commits. The `memberChanges` field explicitly lists which
   member IDs were added and removed, making the diff immediately readable
   without having to compare the two snapshots manually.

3. **Modified flag** — Sets `hierarchyModified = true` on the Investment row
   (requires the schema migration above).

**When to call it**

Replace all calls to `updateInvestmentHierarchy` with this function. The
signature is identical.

**Audit log entry shape**

```json
{
  "event": "hierarchy_manual_override",
  "before": {
    "faId": 696, "fmId": 695, "bmId": 691,
    "rmId": 435, "zmId": null, "agmId": 379, "ccoId": 432
  },
  "after": {
    "faId": 696, "fmId": 700, "bmId": 691,
    "rmId": 435, "zmId": null, "agmId": 379, "ccoId": 432
  },
  "memberChanges": {
    "removed": [695],
    "added": [700]
  },
  "payrollAdjusted": { "year": 2026, "month": 6, "amount": 300000 },
  "editedBy": 123,
  "editedAt": "2026-06-18T10:00:00.000Z"
}
```

**MonthlyPayroll side-effect** (same as original)

When member 695 is removed from Investment 210 (amount 300,000):
- `monthlyPayroll` for memberId=695, year=2026, month=6 → `volumeAchieved` decremented by 300,000

When member 700 is added:
- `monthlyPayroll` for memberId=700, year=2026, month=6 → `volumeAchieved` incremented by 300,000

Member 432 (CCO, currently `volumeAchieved = 2,170,000`) is unaffected because
they appear in both before and after.

---

### 4. `processCommissionsFromSavedHierarchy(data)`

**What it does**

The key function that eliminates manual filtering. It:

1. Calls `getHierarchyEmpNosFromInvestment` to resolve the saved hierarchy.
2. Optionally warns if the hierarchy was manually overridden (returns
   `hierarchyModifiedWarning: true` so the UI can show a confirmation).
3. Passes the resolved `hierarchyEmpNos` list into the existing
   `processCommissions` — bypassing `getUplineChain` entirely.

**When to call it**

Replace direct calls to `processCommissions` in the commissions UI with this
function. The `disabledEmpNos` and `manualEmpNos` exception parameters still
work exactly as before.

**Parameters**

```ts
{
  investmentId: number;
  empNo: string;              // advisor's empNo
  branchId: number;
  disabledEmpNos?: string[];  // toggle off specific members
  manualEmpNos?: string[];    // add members not in saved hierarchy
  skipModifiedWarning?: boolean; // set true to proceed past the override warning
}
```

**Return values**

Normal success:
```json
{ "success": true, "receipt": { ... }, "hierarchyModifiedWarning": false }
```

Override warning (first call when hierarchyModified = true):
```json
{
  "success": false,
  "hierarchyModifiedWarning": true,
  "error": "This investment's hierarchy was manually edited after approval. Re-submit with skipModifiedWarning: true to process using the overridden list."
}
```

**UI flow recommendation**

```
User clicks "Process commissions"
  → call processCommissionsFromSavedHierarchy(data)
  → if hierarchyModifiedWarning === true:
      show dialog: "This investment's hierarchy was manually overridden by HR.
                    The overridden list will be used. Proceed?"
      → on confirm: call again with skipModifiedWarning: true
  → else: proceed normally
```

**Import path note**

The function uses a dynamic import of `processCommissions`:
```ts
const { processCommissions } = await import("./actions");
```
Replace `"./actions"` with the actual path where `processCommissions` is
defined in your project.

---

### 5. `getInvestmentHierarchyAuditLog(investmentId)` (bonus)

**What it does**

Returns all `ActivityLog` entries for an investment that contain hierarchy
events (`hierarchy_snapshot_at_approval` or `hierarchy_manual_override`),
most recent first. Used to populate a "Hierarchy history" panel on the
investment detail page.

**Return value**

```ts
{
  success: boolean;
  logs: Array<{
    id: number;
    action: string;
    performedById: number | null;
    performedByName: string | null;
    createdAt: Date;
    event: string | null;
    before: Record<string, number | null> | null;
    after: Record<string, number | null> | null;
  }>;
}
```

---

## How the pieces fit together

```
HR approves investment
  └── approveInvestmentWithHierarchyLog()
        ├── writes faId…ccoId onto Investment row   ← snapshot
        ├── upserts monthlyPayroll for each member
        └── logs "hierarchy_snapshot_at_approval"   ← audit

(optional) HR edits hierarchy post-approval
  └── updateInvestmentHierarchyWithAudit()
        ├── role check (ADMIN / HR only)
        ├── diffs old vs new member sets
        ├── adjusts monthlyPayroll (decrement removed, increment added)
        ├── sets hierarchyModified = true on Investment
        └── logs "hierarchy_manual_override" with before/after  ← audit

Commission run
  └── processCommissionsFromSavedHierarchy()
        ├── getHierarchyEmpNosFromInvestment()   ← resolves saved IDs → empNos
        ├── warns if hierarchyModified (UI confirms)
        └── processCommissions({ hierarchyEmpNos: [...] })
              └── skips getUplineChain() entirely
```

---

## Checklist before deploying

- [ ] Run the `hierarchyModified` column migration (optional but recommended).
- [ ] Add the `upsertActivationsForInvestment` call inside
      `approveInvestmentWithHierarchyLog` at the marked comment.
- [ ] Update the `import("./actions")` path in
      `processCommissionsFromSavedHierarchy` to match your actual file layout.
- [ ] Replace `approveInvestment` call sites with `approveInvestmentWithHierarchyLog`.
- [ ] Replace `updateInvestmentHierarchy` call sites with `updateInvestmentHierarchyWithAudit`.
- [ ] Replace `processCommissions` call sites in the commission UI with
      `processCommissionsFromSavedHierarchy`.
- [ ] Add the `hierarchyModifiedWarning` confirmation dialog to the commission UI.
- [ ] Add `HIERARCHY_EDIT` activity entity to `ActivityEntity` enum if you want
      stricter filtering (currently reuses `INVESTMENT`).
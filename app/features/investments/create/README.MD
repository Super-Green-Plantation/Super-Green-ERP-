# Investment Create/Edit Form

This folder contains the form used to create a new investment for an existing
client, and to edit an existing investment (including the management
approve/reject flow). It was split out of a single ~1,280 line `page.tsx`
into smaller files along natural seams: primitives, domain panels, and
orchestration.

## File map

| File | Responsibility |
|---|---|
| `page.tsx` | Root component. Owns all form state, effects, and submit logic. Assembles the sections below. Default export used by callers (e.g. `clients/createClient/page.tsx`). |
| `types.ts` | Shared types (`InitialData`, `BeneficiaryFields`, `NomineeFields`), empty-state constants, `beneficiaryFromRecord`/`nomineeFromRecord`/`isEqual` helpers, and `uploadToSupabase`. |
| `ui.tsx` | Generic, domain-free primitives: `SectionHeader`, `Field`, `ModeToggle`. Reusable outside this form if needed. |
| `ClientSearch.tsx` | Client search input + portal dropdown. Shows a locked/read-only view when editing an existing investment. |
| `BeneficiaryPanel.tsx` | Beneficiary mode toggle content: card list (existing) or edit fields (new / editing a selected existing record). |
| `NomineePanel.tsx` | Same pattern as `BeneficiaryPanel`, for nominees. |
| `InvestmentDocuments.tsx` | Pay Slip / Proposal Form / Agreement upload cards with preview. Create mode only. |
| `ApprovalSection.tsx` | Management approve/reject panel, review note, and the actions that call `approveInvestmentWithHierarchyLog` / `rejectInvestment`. Owns its own `isApproving`/`isRejecting` loading state. |
| `AdvisorHierarchy.tsx` | Pre-existing, untouched. Renders/edits the FA→CCO hierarchy fields. |

## Data flow (create mode)

1. User searches and selects a **client** (`ClientSearch`).
2. Selecting a client auto-fills the **hierarchy** (`faId`...`ccoId`) from the
   client's own hierarchy fields, unless the client is locked (edit mode).
3. User picks a **financial plan** → rates default from `plan.rate`, then the
   **harvest** (monthly/total) is recalculated whenever amount, rates, or plan
   change.
4. User optionally fills in **beneficiary** and **nominee** (see rules below).
5. User optionally uploads **investment documents** (create mode only) —
   these upload to Supabase Storage *after* the investment record is created,
   since the upload path is keyed by the returned investment id.
6. `handleSubmit` validates the core fields with `investmentFormSchema` (Zod),
   resolves beneficiary/nominee to either an existing id or a "create new"
   payload, then calls `createInvestmentForExistingClient` or
   `updateInvestment`.
7. If the signed-in user is a manager and the investment is still `PENDING`,
   `ApprovalSection` is shown, allowing approve/reject independently of the
   main submit button.

## Beneficiary / Nominee resolution rule (important business logic)

This is easy to misread as a bug, so it's documented here explicitly:

- **Mode "existing", record unchanged** → the original `beneficiaryId` /
  `nomineeId` is reused. No new database record is created.
- **Mode "existing", but the user edited any field after selecting a
  card** → treated as a **new record**. The original record is left alone,
  and a fresh beneficiary/nominee is created and linked to the investment.
- **Mode "new"** → always creates a new record (if a name was entered).
- **Mode "none"** → no beneficiary/nominee is linked.

In other words: editing an "existing" beneficiary/nominee inline **never
mutates the original person's record** — it forks a new one. This is why
`originalBeneficiary`/`originalNominee` snapshots exist (for change
detection via `isEqual`), and why the UI shows a "MODIFIED" badge before
submission.

## Known behavior note (post-refactor)

In the original single-file version, the main "Create/Update Investment
Record" submit button was disabled while `isApproving` or `isRejecting` was
true (both approve/reject and the main submit shared state in one
component). After the split, `ApprovalSection` owns its own loading state
locally, so the main submit button now only checks `isUpdating`. In practice
the two actions are on separate buttons and rarely fire at once, but if you
need the old cross-disabling behavior back, lift `isApproving`/`isRejecting`
into `page.tsx` and pass them down as props instead.

## Verification checklist when touching this folder

- `tsc --noEmit` / `next build` passes.
- Creating an investment still uploads documents *after* creation succeeds,
  not before (upload is keyed by the new investment id).
- Editing an existing beneficiary/nominee's fields without changing anything
  does **not** create a duplicate record; changing even one field does.
- The approval/reject actions still call `approveInvestmentWithHierarchyLog`
  and `rejectInvestment` respectively, and both `onSuccess?.()` on success.
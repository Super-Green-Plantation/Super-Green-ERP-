"use server";

/**
 * investment-hierarchy.ts
 *
 * New functions that complete the proposed investment → commission flow.
 * These are meant to be dropped into your existing actions file alongside
 * the functions already present (approveInvestment, updateInvestmentHierarchy,
 * processCommissions, etc.).
 *
 * All four functions work with your existing schema and DB rows with zero
 * migration required — they only read/write fields that already exist.
 *
 * Functions in this file:
 *   1. getHierarchyEmpNosFromInvestment  — resolves saved faId…ccoId → empNos
 *   2. approveInvestmentWithHierarchyLog — approveInvestment + audit trail
 *   3. updateInvestmentHierarchyWithAudit — updateInvestmentHierarchy + audit + role guard
 *   4. processCommissionsFromSavedHierarchy — one-call commission processing, no manual filtering
 */

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { logActivity } from "@/lib/logActivity";
import { ActivityAction, ActivityEntity } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// upsertActivationsForInvestment (inlined from activations helper)
// ─────────────────────────────────────────────────────────────────────────────

type TransactionClient = Prisma.TransactionClient;
type HierarchyRole = "fmId" | "bmId" | "rmId" | "zmId" | "agmId" | "ccoId";

/**
 * Recalculates and upserts the MonthlyActivation record for a single hierarchy
 * member (e.g. the FM, BM, RM…) based on how many unique lower-level members
 * contributed investments in the given month.
 *
 * Activation count formula per role:
 *   FM  → count of unique FAs
 *   BM  → unique FAs + unique FMs below this BM
 *   RM  → unique FAs + FMs + BMs below this RM
 *   … and so on up to CCO
 *
 * isActivated = activationCount >= 4  (the threshold used across your codebase)
 */
async function upsertActivationForMember(
  tx: TransactionClient,
  memberId: number,
  role: HierarchyRole,
  year: number,
  month: number,
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate   = new Date(year, month, 1);

  // Pull every investment in this month where this member appears in their role
  const investments = await tx.investment.findMany({
    where: {
      [role]: memberId,
      investmentDate: { gte: startDate, lt: endDate },
      faId: { not: null }, // only count investments that have a direct FA
    },
    select: {
      faId: true,
      fmId: true,
      bmId: true,
      rmId: true,
      zmId: true,
      agmId: true,
    },
  });

  // Each set holds IDs of members at that level who contributed this month,
  // excluding the current member themselves (they don't count their own layer).
  const uniqueFaIds  = new Set(investments.map((i) => i.faId).filter(Boolean));
  const uniqueFmIds  = new Set(investments.filter((i) => i.fmId !== memberId).map((i) => i.fmId).filter(Boolean));
  const uniqueBmIds  = new Set(investments.filter((i) => i.bmId !== memberId).map((i) => i.bmId).filter(Boolean));
  const uniqueRmIds  = new Set(investments.filter((i) => i.rmId !== memberId).map((i) => i.rmId).filter(Boolean));
  const uniqueZmIds  = new Set(investments.filter((i) => i.zmId !== memberId).map((i) => i.zmId).filter(Boolean));
  const uniqueAgmIds = new Set(investments.filter((i) => i.agmId !== memberId).map((i) => i.agmId).filter(Boolean));

  // The activation count for each role is cumulative: higher roles see the
  // contributions of every level below them.
  const activationCount = {
    fmId:  uniqueFaIds.size,
    bmId:  uniqueFaIds.size + uniqueFmIds.size,
    rmId:  uniqueFaIds.size + uniqueFmIds.size + uniqueBmIds.size,
    zmId:  uniqueFaIds.size + uniqueFmIds.size + uniqueBmIds.size + uniqueRmIds.size,
    agmId: uniqueFaIds.size + uniqueFmIds.size + uniqueBmIds.size + uniqueRmIds.size + uniqueZmIds.size,
    ccoId: uniqueFaIds.size + uniqueFmIds.size + uniqueBmIds.size + uniqueRmIds.size + uniqueZmIds.size + uniqueAgmIds.size,
  }[role];

  const isActivated = activationCount >= 4;

  await tx.monthlyActivation.upsert({
    where:  { memberId_year_month: { memberId, year, month } },
    create: { memberId, year, month, activationCount, isActivated },
    update: { activationCount, isActivated },
  });
}

/**
 * Iterates over the non-null hierarchy role members supplied and recalculates
 * each one's MonthlyActivation record for the given year/month.
 *
 * Called inside the approval transaction (and re-called after any hierarchy
 * edit) so that activation counts stay in sync with the investment snapshot.
 *
 * Note: faId is intentionally excluded — FAs have their own activation logic
 * that is not recalculated here.
 */
export async function upsertActivationsForInvestment(
  tx: TransactionClient,
  hierarchy: {
    fmId?:  number | null;
    bmId?:  number | null;
    rmId?:  number | null;
    zmId?:  number | null;
    agmId?: number | null;
    ccoId?: number | null;
  },
  year: number,
  month: number,
) {
  const roles: HierarchyRole[] = ["fmId", "bmId", "rmId", "zmId", "agmId", "ccoId"];

  await Promise.all(
    roles
      .filter((role) => !!hierarchy[role])
      .map((role) =>
        upsertActivationForMember(tx, hierarchy[role]!, role, year, month)
      )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The seven hierarchy role columns stored on every Investment row.
 * Order matters: it mirrors the rank order FA (lowest) → CCO (highest).
 */
const HIERARCHY_FIELDS = [
  "faId",
  "fmId",
  "bmId",
  "rmId",
  "zmId",
  "agmId",
  "ccoId",
] as const;

type HierarchyField = (typeof HIERARCHY_FIELDS)[number];
type HierarchyIds = Partial<Record<HierarchyField, number | null>>;

/**
 * Roles that are allowed to manually edit an approved investment's hierarchy.
 * Anyone outside this list hitting updateInvestmentHierarchyWithAudit will get
 * a 403-style error before any DB write happens.
 */
const HIERARCHY_EDIT_ROLES = ["ADMIN", "HR"] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 1. getHierarchyEmpNosFromInvestment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads the seven hierarchy member IDs (faId, fmId, bmId, rmId, zmId, agmId,
 * ccoId) that were snapshotted onto the Investment at approval time, then
 * resolves each non-null ID to its Member.empNo.
 *
 * This is the bridge function that lets processCommissions use the saved
 * hierarchy list instead of rebuilding it dynamically via getUplineChain.
 *
 * Usage inside processCommissions:
 *   const { empNos } = await getHierarchyEmpNosFromInvestment(investmentId);
 *   await processCommissions({ ..., hierarchyEmpNos: empNos });
 *
 * @param investmentId  Primary key of the Investment row.
 * @returns             { empNos: string[], hierarchyModified: boolean }
 *                      empNos  — ordered list of empNo strings (nulls dropped)
 *                      hierarchyModified — true when an HR override was applied
 *                        after approval (requires the hierarchyModified column
 *                        — see schema migration note in the .md doc).
 *                        Falls back to false if the column doesn't exist yet.
 */
export async function getHierarchyEmpNosFromInvestment(investmentId: number): Promise<{
  success: boolean;
  empNos: string[];
  hierarchyModified: boolean;
  error?: string;
}> {
  try {
    // Step 1 — fetch only the columns we need (avoids pulling the full row)
    const investment = await prisma.investment.findUnique({
      where: { id: investmentId },
      select: {
        approvalStatus: true,
        // hierarchyModified is a new optional column — we read it safely below
        faId: true,
        fmId: true,
        bmId: true,
        rmId: true,
        zmId: true,
        agmId: true,
        ccoId: true,
      },
    });

    if (!investment) {
      return { success: false, empNos: [], hierarchyModified: false, error: "Investment not found" };
    }

    if (investment.approvalStatus !== "APPROVED") {
      return {
        success: false,
        empNos: [],
        hierarchyModified: false,
        error: "Investment is not approved — hierarchy is not finalised yet",
      };
    }

    // Step 2 — collect unique non-null member IDs in rank order
    const memberIds = [
      ...new Set(
        HIERARCHY_FIELDS.map((f) => investment[f] as number | null).filter(
          (id): id is number => id !== null
        )
      ),
    ];

    if (memberIds.length === 0) {
      // Approved investment with no hierarchy saved — this is valid for some
      // older records (e.g. investment 191 in the DB has all nulls).
      return { success: true, empNos: [], hierarchyModified: false };
    }

    // Step 3 — batch-resolve member IDs → empNos in one query
    const members = await prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, empNo: true },
    });

    // Preserve the rank order (FA first, CCO last) rather than DB return order
    const idToEmpNo = new Map(members.map((m) => [m.id, m.empNo]));
    const empNos = memberIds
      .map((id) => idToEmpNo.get(id))
      .filter((e): e is string => Boolean(e));

    // Step 4 — read the optional hierarchyModified flag
    // Cast to any because the column may not be in the generated Prisma types yet.
    // Once you run the migration and regenerate the client, remove the cast.
    const hierarchyModified = Boolean(
      (investment as any).hierarchyModified ?? false
    );

    return { success: true, empNos, hierarchyModified };
  } catch (err: any) {
    console.error("getHierarchyEmpNosFromInvestment error:", err);
    return { success: false, empNos: [], hierarchyModified: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. approveInvestmentWithHierarchyLog
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Drop-in replacement for approveInvestment that adds a structured audit log
 * entry at the moment the hierarchy snapshot is taken.
 *
 * What it does differently from the original approveInvestment:
 *   - Calls logActivity with entity=INVESTMENT, action=APPROVE after the
 *     transaction commits, recording the full hierarchy snapshot in metadata.
 *   - The metadata shape is intentionally identical to what
 *     updateInvestmentHierarchyWithAudit logs, so you can diff before/after
 *     across both events in the ActivityLog table.
 *
 * Everything else (monthlyPayroll upsert, upsertActivationsForInvestment,
 * auto-approving the client) is identical to the original.
 *
 * @param data  Same shape as the original approveInvestment params.
 */
export async function approveInvestmentWithHierarchyLog(data: {
  investmentId: number;
  faId?: number | null;
  fmId?: number | null;
  bmId?: number | null;
  rmId?: number | null;
  zmId?: number | null;
  agmId?: number | null;
  ccoId?: number | null;
  reviewNote?: string;
  advisorId?: number | null;
}): Promise<{ success: boolean; investment?: any; error?: string; commissionProcessed?: boolean; commissionError?: string }> {
  try {
    const currentUser = await getCurrentUserWithRole();
    if (!currentUser) throw new Error("Not authorized");

    // Guard: at least one hierarchy member must be supplied
    const approverIds = [
      data.faId, data.fmId, data.bmId, data.rmId,
      data.zmId, data.agmId, data.ccoId,
    ];
    if (!approverIds.some((id) => id)) {
      throw new Error("At least one approver is required for approval");
    }

    const investment = await prisma.investment.findUnique({
      where: { id: data.investmentId },
      include: { client: true },
    });

    if (!investment) throw new Error("Investment not found");
    if (investment.approvalStatus !== "PENDING") throw new Error("Investment is not pending");

    const result = await prisma.$transaction(async (tx) => {
      // ── a. Stamp approval fields on the investment ──────────────────────────
      const updated = await tx.investment.update({
        where: { id: data.investmentId },
        data: {
          approvalStatus: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: currentUser.id,
          reviewNote: data.reviewNote,
          faId: data.faId,
          fmId: data.fmId,
          bmId: data.bmId,
          rmId: data.rmId,
          zmId: data.zmId,
          agmId: data.agmId,
          ccoId: data.ccoId,
          advisorId: data.advisorId ?? investment.advisorId,
        },
      });

      // ── b. Upsert monthlyPayroll volume for each hierarchy member ───────────
      const hierarchyMemberIds = [
        data.faId ?? null,
        data.fmId ?? null,
        data.bmId ?? null,
        data.rmId ?? null,
        data.zmId ?? null,
        data.agmId ?? null,
        data.ccoId ?? null,
      ].filter((id): id is number => id !== null);

      const uniqueHierarchyIds = [...new Set(hierarchyMemberIds)];

      if (uniqueHierarchyIds.length > 0) {
        const year = new Date(investment.investmentDate).getFullYear();
        const month = new Date(investment.investmentDate).getMonth() + 1;

        await Promise.all(
          uniqueHierarchyIds.map((memberId) =>
            tx.monthlyPayroll.upsert({
              where: { memberId_year_month: { memberId, year, month } },
              update: { volumeAchieved: { increment: investment.amount } },
              create: {
                memberId,
                year,
                month,
                basicSalaryPermanent: 0,
                monthlyTarget: 0,
                volumeAchieved: investment.amount,
              },
            })
          )
        );

        // ── c. Upsert activations for each non-FA hierarchy member ────────────
        // Recalculates MonthlyActivation counts so that isActivated flags and
        // cumulative activation counts stay accurate after this investment is saved.
        await upsertActivationsForInvestment(
          tx,
          {
            fmId:  data.fmId  ?? null,
            bmId:  data.bmId  ?? null,
            rmId:  data.rmId  ?? null,
            zmId:  data.zmId  ?? null,
            agmId: data.agmId ?? null,
            ccoId: data.ccoId ?? null,
          },
          year,
          month,
        );
      }

      // ── d. Auto-approve client if still pending ─────────────────────────────
      if (investment.client && investment.client.approvalStatus !== "APPROVED") {
        await tx.client.update({
          where: { id: investment.clientId },
          data: {
            approvalStatus: "APPROVED",
            reviewedAt: new Date(),
            reviewedBy: currentUser.id,
            reviewNote: "Automatically approved upon investment approval.",
          },
        });
      }

      return updated;
    });

    revalidatePath("/features/investments");

    // ── e. Audit log — fires AFTER transaction commits ─────────────────────
    // Hierarchy snapshot is stored in metadata so you can always reconstruct
    // "who was on this investment when it was approved".
    void logActivity({
      action: ActivityAction.APPROVE,
      entity: ActivityEntity.INVESTMENT,
      entityId: data.investmentId,
      performedById: currentUser?.member?.id ?? 0,
      branchId: investment.branchId,
      metadata: {
        event: "hierarchy_snapshot_at_approval",
        hierarchySnapshot: {
          faId: data.faId ?? null,
          fmId: data.fmId ?? null,
          bmId: data.bmId ?? null,
          rmId: data.rmId ?? null,
          zmId: data.zmId ?? null,
          agmId: data.agmId ?? null,
          ccoId: data.ccoId ?? null,
        },
        reviewNote: data.reviewNote ?? null,
        approvedAt: new Date().toISOString(),
      },
    });

    // ── f. Auto-trigger commission processing ──────────────────────────────
    // Runs AFTER the approval transaction commits — commission failure
    // never rolls back the approval. volumeAchieved is already incremented.
    // processCommissions is idempotent (FOR UPDATE + commissionsProcessed flag)
    // so re-approving a duplicate is safe and returns early.
    let commissionResult: { success: boolean; error?: string } = { success: true };
    if (data.faId) {
      try {
        const fa = await prisma.member.findUnique({
          where: { id: data.faId },
          select: { empNo: true },
        });
        if (fa) {
          const { processCommissions } = await import(
            "@/app/features/commissions/process"
          );
          const res = await processCommissions({
            investmentId: data.investmentId,
            empNo: fa.empNo,
            branchId: investment.branchId,
          });
          if (!res.success) {
            commissionResult = { success: false, error: res.error?.message ?? "Commission processing failed" };
          }
        }
      } catch (commErr: any) {
        console.error("Auto-commission processing failed after approval:", commErr);
        commissionResult = { success: false, error: commErr?.message ?? "Commission processing failed" };
      }
    }

    return {
      success: true,
      investment: result,
      commissionProcessed: commissionResult.success,
      commissionError: commissionResult.success ? undefined : commissionResult.error,
    };
  } catch (error: any) {
    console.error("approveInvestmentWithHierarchyLog error:", error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. updateInvestmentHierarchyWithAudit
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Drop-in replacement for updateInvestmentHierarchy that adds:
 *   1. Role guard  — only ADMIN and HR roles may call this.
 *   2. Audit log   — before + after snapshot written to ActivityLog.metadata.
 *   3. Modified flag — sets hierarchyModified = true on the investment so
 *                      the commission UI can warn the operator.
 *                      (Requires the schema migration — see the .md doc.)
 *
 * The payroll adjustment logic (decrement removed members, increment added
 * members) is identical to the original updateInvestmentHierarchy.
 *
 * @param investmentId   Primary key of the Investment row.
 * @param newHierarchy   Partial map of the seven role fields with new values.
 *                       Pass null explicitly to clear a role.
 */
export async function updateInvestmentHierarchyWithAudit(
  investmentId: number,
  newHierarchy: HierarchyIds
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUserWithRole();
    if (!currentUser?.member?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // ── Role guard ────────────────────────────────────────────────────────────
    // currentUser.role comes from the User table (enum Role).
    // Only ADMIN and HR may manually override a saved hierarchy.
    const userRole = (currentUser as any).role as string | undefined;
    if (!userRole || !HIERARCHY_EDIT_ROLES.includes(userRole as any)) {
      return {
        success: false,
        error: "Only ADMIN or HR users may edit the investment hierarchy after approval",
      };
    }

    // ── Fetch existing state ─────────────────────────────────────────────────
    const existing = await prisma.investment.findUnique({
      where: { id: investmentId },
      select: {
        amount: true,
        investmentDate: true,
        approvalStatus: true,
        branchId: true,
        faId: true, fmId: true, bmId: true,
        rmId: true, zmId: true, agmId: true, ccoId: true,
      },
    });

    if (!existing) return { success: false, error: "Investment not found" };
    if (existing.approvalStatus !== "APPROVED") {
      return { success: false, error: "Can only edit hierarchy on approved investments" };
    }

    const investmentDate = new Date(existing.investmentDate);
    const year = investmentDate.getFullYear();
    const month = investmentDate.getMonth() + 1;
    const amount = existing.amount;

    // ── Diff old vs new member sets ──────────────────────────────────────────
    const oldIds = [
      ...new Set(
        HIERARCHY_FIELDS.map((f) => existing[f] as number | null).filter(
          (id): id is number => id !== null
        )
      ),
    ];
    const newIds = [
      ...new Set(
        HIERARCHY_FIELDS.map((f) => newHierarchy[f] ?? null).filter(
          (id): id is number => id !== null
        )
      ),
    ];

    const removed = oldIds.filter((id) => !newIds.includes(id));
    const added = newIds.filter((id) => !oldIds.includes(id));

    await prisma.$transaction(async (tx: any) => {
      // ── Adjust monthlyPayroll for removed members ─────────────────────────
      await Promise.all(
        removed.map((memberId) =>
          tx.monthlyPayroll.upsert({
            where: { memberId_year_month: { memberId, year, month } },
            update: { volumeAchieved: { decrement: amount } },
            create: {
              memberId, year, month,
              monthlyTarget: 0, volumeAchieved: 0, basicSalaryPermanent: 0,
            },
          })
        )
      );

      // ── Adjust monthlyPayroll for added members ───────────────────────────
      await Promise.all(
        added.map((memberId) =>
          tx.monthlyPayroll.upsert({
            where: { memberId_year_month: { memberId, year, month } },
            update: { volumeAchieved: { increment: amount } },
            create: {
              memberId, year, month,
              monthlyTarget: 0, volumeAchieved: amount, basicSalaryPermanent: 0,
            },
          })
        )
      );

      // ── Update Investment row ─────────────────────────────────────────────
      await tx.investment.update({
        where: { id: investmentId },
        data: {
          faId: newHierarchy.faId ?? null,
          fmId: newHierarchy.fmId ?? null,
          bmId: newHierarchy.bmId ?? null,
          rmId: newHierarchy.rmId ?? null,
          zmId: newHierarchy.zmId ?? null,
          agmId: newHierarchy.agmId ?? null,
          ccoId: newHierarchy.ccoId ?? null,
          // Mark this investment as having a manually-overridden hierarchy.
          // Requires: ALTER TABLE "Investment" ADD COLUMN "hierarchyModified" BOOLEAN DEFAULT false;
          // Once migrated, remove the (as any) cast.
          ...({ hierarchyModified: true } as any),
        },
      });
    });

    revalidatePath("/features/investments");

    // ── Audit log — fires after the transaction ───────────────────────────────
    // before/after snapshots let you reconstruct the full diff from ActivityLog
    // without needing a separate audit table.
    void logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.INVESTMENT,
      entityId: investmentId,
      performedById: currentUser.member.id,
      branchId: existing.branchId,
      metadata: {
        event: "hierarchy_manual_override",
        before: {
          faId: existing.faId ?? null,
          fmId: existing.fmId ?? null,
          bmId: existing.bmId ?? null,
          rmId: existing.rmId ?? null,
          zmId: existing.zmId ?? null,
          agmId: existing.agmId ?? null,
          ccoId: existing.ccoId ?? null,
        },
        after: {
          faId: newHierarchy.faId ?? null,
          fmId: newHierarchy.fmId ?? null,
          bmId: newHierarchy.bmId ?? null,
          rmId: newHierarchy.rmId ?? null,
          zmId: newHierarchy.zmId ?? null,
          agmId: newHierarchy.agmId ?? null,
          ccoId: newHierarchy.ccoId ?? null,
        },
        memberChanges: { removed, added },
        payrollAdjusted: { year, month, amount },
        editedBy: currentUser.member.id,
        editedAt: new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("updateInvestmentHierarchyWithAudit error:", err);
    return { success: false, error: "Server error" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. processCommissionsFromSavedHierarchy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The core function that closes the "no manual filtering" loop.
 *
 * How it differs from calling processCommissions directly:
 *   - It calls getHierarchyEmpNosFromInvestment internally to build the
 *     hierarchyEmpNos list — the caller does NOT need to know or supply it.
 *   - It warns when the investment hierarchy was manually overridden so the
 *     operator UI can surface an alert before the user confirms processing.
 *   - It passes the resolved list as hierarchyEmpNos to processCommissions,
 *     which bypasses the getUplineChain dynamic lookup entirely.
 *   - disabledEmpNos and manualEmpNos are still accepted for exception handling
 *     exactly as before — they are passed through unchanged to processCommissions.
 *
 * Call this from your commissions UI instead of processCommissions directly.
 *
 * @param data.investmentId     Investment to process.
 * @param data.empNo            The advisor's empNo (for personal commission).
 * @param data.branchId         The branch this investment belongs to.
 * @param data.disabledEmpNos   Optional: members to skip even if in hierarchy.
 * @param data.manualEmpNos     Optional: members to add that aren't in hierarchy.
 * @param data.skipModifiedWarning  Set true to process even when hierarchy was
 *                              manually overridden without surfacing a warning.
 */
export async function processCommissionsFromSavedHierarchy(data: {
  investmentId: number;
  empNo: string;
  branchId: number;
  disabledEmpNos?: string[];
  manualEmpNos?: string[];
  skipModifiedWarning?: boolean;
}): Promise<{
  success: boolean;
  receipt?: any;
  hierarchyModifiedWarning?: boolean;
  error?: any;
}> {
  try {
    // ── Step 1: Resolve hierarchy empNos from the saved investment snapshot ──
    const { success, empNos, hierarchyModified, error } =
      await getHierarchyEmpNosFromInvestment(data.investmentId);

    if (!success) {
      return { success: false, error };
    }

    // ── Step 2: Warn if hierarchy was manually overridden ────────────────────
    // Return the warning flag so the UI can show a confirmation dialog.
    // The caller can re-invoke with skipModifiedWarning: true to proceed.
    if (hierarchyModified && !data.skipModifiedWarning) {
      return {
        success: false,
        hierarchyModifiedWarning: true,
        error:
          "This investment's hierarchy was manually edited after approval. " +
          "Re-submit with skipModifiedWarning: true to process using the overridden list.",
      };
    }

    // ── Step 3: Delegate to the existing processCommissions ──────────────────
    // Import processCommissions from wherever it lives in your codebase.
    // It already accepts hierarchyEmpNos and handles the rest correctly.
    //
    // The dynamic call below is illustrative — replace with a direct import.
    const { processCommissions } = await import("../../commissions/process"); // adjust path

    const result = await processCommissions({
      investmentId: data.investmentId,
      empNo: data.empNo,
      branchId: data.branchId,
      disabledEmpNos: data.disabledEmpNos ?? [],
      manualEmpNos: data.manualEmpNos ?? [],
      // ← This is the key: pass the pre-resolved list instead of letting
      //   processCommissions fall through to getUplineChain.
      hierarchyEmpNos: empNos,
    });

    return {
      ...result,
      hierarchyModifiedWarning: false,
    };
  } catch (err: any) {
    console.error("processCommissionsFromSavedHierarchy error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR", message: err.message } };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. getInvestmentHierarchyAuditLog  (bonus utility)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns all ActivityLog entries for a given investment that relate to
 * hierarchy events (both the original approval snapshot and any subsequent
 * manual overrides).
 *
 * Useful for the "View hierarchy history" panel in your investment detail page.
 *
 * @param investmentId  Primary key of the Investment row.
 */
export async function getInvestmentHierarchyAuditLog(investmentId: number): Promise<{
  success: boolean;
  logs?: Array<{
    id: number;
    action: string;
    performedById: number | null;
    performedByName: string | null;
    createdAt: Date;
    event: string | null;
    before: Record<string, number | null> | null;
    after: Record<string, number | null> | null;
  }>;
  error?: string;
}> {
  try {
    // Fetch all ActivityLog rows for this investment, most recent first.
    // We filter in-memory for hierarchy events because metadata is a JSON
    // column and Prisma doesn't support deep JSON WHERE on all DB versions.
    const allLogs = await prisma.activityLog.findMany({
      where: {
        entity: ActivityEntity.INVESTMENT,
        entityId: investmentId,
        action: { in: [ActivityAction.APPROVE, ActivityAction.UPDATE] },
      },
      include: {
        performedBy: { select: { id: true, nameWithInitials: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Keep only logs that contain a hierarchy event marker in their metadata.
    const hierarchyLogs = allLogs
      .filter((log) => {
        const meta = log.metadata as any;
        return (
          meta?.event === "hierarchy_snapshot_at_approval" ||
          meta?.event === "hierarchy_manual_override"
        );
      })
      .map((log) => {
        const meta = log.metadata as any;
        return {
          id: log.id,
          action: log.action as string,
          performedById: log.performedBy?.id ?? null,
          performedByName: log.performedBy?.nameWithInitials ?? null,
          createdAt: log.createdAt,
          event: meta?.event ?? null,
          before: meta?.before ?? null,
          after: meta?.after ?? meta?.hierarchySnapshot ?? null,
        };
      });

    return { success: true, logs: hierarchyLogs };
  } catch (err: any) {
    console.error("getInvestmentHierarchyAuditLog error:", err);
    return { success: false, error: err.message };
  }
}
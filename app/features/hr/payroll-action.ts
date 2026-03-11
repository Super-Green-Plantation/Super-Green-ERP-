"use server";

import { calculatePayroll } from "@/lib/payroll-utils";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

type PayrollBreakdown = {
    basicSalary: number;
    monthlyTarget: number;
    volumeAchieved: number;
    incentiveEarned: number;
    allowanceEarned: number;
    orcEarned: number;
    commissionEarned: number;
    epfDeduction: number;   // employee pays this (deducted from gross)
    epfEmployer: number;    // employer pays this (not deducted, shown for info)
    etfEmployer: number;    // employer pays this (not deducted, shown for info)
    incentiveHit: boolean;
    allowanceHit: boolean;
    grossPay: number;       // basic + incentive + allowance + orc + commission
    netPay: number;         // grossPay - epfDeduction
};


// ─── getPayrollPreview ────────────────────────────────────────────────────────
/**
 * Read-only preview — no DB writes.
 *
 * Loads all ACTIVE members in a branch with their position salary config
 * and any existing MonthlyPayroll record for the given month.
 *
 * Returns a list of preview rows the UI renders in a table. Each row shows:
 *  - Employee name, position, status
 *  - Whether they already have a payroll record this month (alreadyProcessed)
 *  - A projected breakdown if volumes are passed in (used for live preview)
 *
 * volumes: optional map of { memberId → volumeAchieved } for live calculation
 */
export async function getPayrollPreview(
    branchId: number,
    year: number,
    month: number,
    volumes: Record<number, number> = {},
) {
    const branchMembers = await prisma.memberBranch.findMany({
        where: { branchId },
        include: {
            member: {
                include: {
                    position: { include: { salary: true } },
                    monthlyPayrolls: {
                        where: { year, month },
                    },
                },
            },
        },
    });

    const rows = branchMembers.map(({ member }: any) => {
        const salary = member.position?.salary;
        const existing = member.monthlyPayrolls?.[0] ?? null;
        const volumeAchieved = volumes[member.id] ?? existing?.volumeAchieved ?? 0;

        let breakdown: PayrollBreakdown | null = null;
        if (salary) {
            breakdown = calculatePayroll(
                salary,
                member.status,
                volumeAchieved,
            );
        }

        return {
            memberId: member.id,
            name: member.nameWithInitials ?? member.name,
            empNo: member.empNo,
            position: member.position?.title ?? "—",
            status: member.status,
            alreadyProcessed: !!existing,
            salaryConfigured: !!salary,
            volumeAchieved,
            breakdown,
        };
    });

    return rows;
}

// ─── runMonthlyPayroll ────────────────────────────────────────────────────────
/**
 * Commits payroll for an entire branch for a given month.
 *
 * volumes: map of { memberId → volumeAchieved } — HR enters these manually
 * force:   if true, overwrites existing payroll records for this month
 *          if false, skips members who already have a record
 *
 * For each member:
 *  1. Loads their salary config
 *  2. Calls calculatePayroll() to get the full breakdown
 *  3. Upserts a MonthlyPayroll record
 *
 * Returns a summary: { processed, skipped, errors }
 */
export async function runMonthlyPayroll(
    branchId: number,
    year: number,
    month: number,
    volumes: Record<number, number>, // { memberId: volumeAchieved }
    force = false,
) {
    const branchMembers = await prisma.memberBranch.findMany({
        where: { branchId },
        include: {
            member: {
                include: {
                    position: { include: { salary: true } },
                    monthlyPayrolls: { where: { year, month } },
                },
            },
        },
    });

    let processed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const { member } of branchMembers) {
        const salary = member.position?.salary;

        if (!salary) {
            errors.push(`${member.nameWithInitials}: no salary config for position`);
            continue;
        }

        const alreadyProcessed = member.monthlyPayrolls?.length > 0;
        if (alreadyProcessed && !force) {
            skipped++;
            continue;
        }

        const volumeAchieved = volumes[member.id] ?? 0;
        const breakdown = calculatePayroll(salary, member.status, volumeAchieved);

        try {
            await prisma.monthlyPayroll.upsert({
                where: { memberId_year_month: { memberId: member.id, year, month } },
                create: {
                    memberId: member.id,
                    year,
                    month,
                    ...breakdown,
                },
                update: {
                    ...breakdown,
                },
            });
            processed++;
        } catch (e) {
            errors.push(`${member.nameWithInitials}: ${String(e)}`);
        }
    }

    revalidatePath("/features/hr/payroll");
    return { success: true, processed, skipped, errors };
}

// ─── getPayrollHistory ────────────────────────────────────────────────────────
/**
 * Loads all MonthlyPayroll records for a single employee, ordered newest first.
 * Used on the individual employee payroll history page.
 */
export async function getPayrollHistory(memberId: number) {
    return prisma.monthlyPayroll.findMany({
        where: { memberId },
        orderBy: [{ year: "desc" }, { month: "desc" }],
    });
}
import { describe, it, expect } from "vitest";
import { resolvePositionTarget, resolveMemberTarget } from "./resolvePositionTarget";

describe("resolvePositionTarget & resolveMemberTarget", () => {
  it("resolves probation targets based on date of join and year/month", () => {
    const member = {
      id: 1,
      empNo: "EMP-001",
      dateOfJoin: new Date("2026-01-01"),
      status: "PROBATION",
      position: {
        id: 1,
        title: "Field Advisor",
        isProbation: true,
        after6MonthTarget: 0,
        salary: { monthlyTarget: 2500000 },
        positionTargets: [
          { periodNumber: 1, monthNumber: 1, targetAmount: 500000, bonusAmount: 0, partialBonus: 20000, partialThresholdPct: 0.25 },
          { periodNumber: 1, monthNumber: 2, targetAmount: 750000, bonusAmount: 0, partialBonus: 20000, partialThresholdPct: 0.25 },
        ],
      },
    };

    // Month 1 of join (Jan 2026) -> period 1, month 1 target
    const targetJan = resolvePositionTarget(member, 2026, 1);
    expect(targetJan).not.toBeNull();
    expect(targetJan?.targetAmount).toBe(500000);

    const memberTargetJan = resolveMemberTarget(member, 2026, 1);
    expect(memberTargetJan).toBe(500000);
  });

  it("falls back to PositionSalary.monthlyTarget when past 6 months and after6MonthTarget <= 0", () => {
    const member = {
      id: 2,
      empNo: "EMP-002",
      dateOfJoin: new Date("2025-01-01"),
      status: "PERMANENT",
      position: {
        id: 1,
        title: "Field Advisor",
        isProbation: false,
        after6MonthTarget: 0, // Not explicitly set on position
        salary: { monthlyTarget: 2500000 },
        positionTargets: [],
      },
    };

    // October 2026 -> >6 months elapsed
    const targetOct = resolvePositionTarget(member, 2026, 10);
    // resolvePositionTarget returns null because after6MonthTarget is 0
    expect(targetOct).toBeNull();

    // resolveMemberTarget falls back to salary.monthlyTarget (2.5M)
    const memberTargetOct = resolveMemberTarget(member, 2026, 10);
    expect(memberTargetOct).toBe(2500000);
  });

  it("handles members with position after6MonthTarget > 0 correctly", () => {
    const member = {
      id: 3,
      empNo: "EMP-003",
      probationStartDate: new Date("2025-01-01"),
      status: "PROBATION",
      position: {
        id: 2,
        title: "Team Leader",
        isProbation: true,
        salary: { monthlyTarget: 3000000 },
        positionTargets: [
          {
            periodNumber: 1,
            monthNumber: 1,
            targetAmount: 1000000,
            after6MonthTarget: 3000000,
            after6MonthIncentivePct: 0.45,
            after6MonthExcessRate: 0.005,
          },
        ],
      },
    };

    const targetOct = resolvePositionTarget(member, 2026, 10);
    expect(targetOct).not.toBeNull();
    expect(targetOct?.targetAmount).toBe(3000000);

    const memberTargetOct = resolveMemberTarget(member, 2026, 10);
    expect(memberTargetOct).toBe(3000000);
  });
});

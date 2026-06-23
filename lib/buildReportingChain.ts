// When adding employee who reports to PM000005 (PER_AGM)
// PM000005's reportingPersons = ["PM000060"]
// New employee's reportingPersons = ["PM000005", "PM000060"]  ← prepend direct manager

import { prisma } from "./prisma";

async function buildReportingChain(directManagerEmpNo: string): Promise<string[]> {
  const manager = await prisma.member.findUnique({
    where: { empNo: directManagerEmpNo },
    select: { empNo: true, reportingPersons: true },
  });
  if (!manager) return [directManagerEmpNo];
  // Chain = direct manager + their upline
  return [directManagerEmpNo, ...manager.reportingPersons];
}
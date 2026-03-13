-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_performedById_fkey";

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_memberId_fkey";

-- DropForeignKey
ALTER TABLE "Commission" DROP CONSTRAINT "Commission_memberEmpNo_fkey";

-- DropForeignKey
ALTER TABLE "Investment" DROP CONSTRAINT "Investment_advisorId_fkey";

-- DropForeignKey
ALTER TABLE "MemberBranch" DROP CONSTRAINT "MemberBranch_memberId_fkey";

-- DropForeignKey
ALTER TABLE "MonthlyEvaluation" DROP CONSTRAINT "MonthlyEvaluation_memberId_fkey";

-- DropForeignKey
ALTER TABLE "MonthlyPayroll" DROP CONSTRAINT "MonthlyPayroll_memberId_fkey";

-- DropForeignKey
ALTER TABLE "PermanentEvaluation" DROP CONSTRAINT "PermanentEvaluation_memberId_fkey";

-- AddForeignKey
ALTER TABLE "MemberBranch" ADD CONSTRAINT "MemberBranch_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermanentEvaluation" ADD CONSTRAINT "PermanentEvaluation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyPayroll" ADD CONSTRAINT "MonthlyPayroll_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyEvaluation" ADD CONSTRAINT "MonthlyEvaluation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_memberEmpNo_fkey" FOREIGN KEY ("memberEmpNo") REFERENCES "Member"("empNo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

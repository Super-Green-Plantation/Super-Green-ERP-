-- DropForeignKey
ALTER TABLE "MemberBranch" DROP CONSTRAINT "MemberBranch_branchId_fkey";

-- AddForeignKey
ALTER TABLE "MemberBranch" ADD CONSTRAINT "MemberBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

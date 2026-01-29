/*
  Warnings:

  - You are about to drop the column `managerId` on the `Member` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "Member_managerId_fkey";

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "managerId";

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_memberEmpNo_fkey" FOREIGN KEY ("memberEmpNo") REFERENCES "Member"("empNo") ON DELETE RESTRICT ON UPDATE CASCADE;

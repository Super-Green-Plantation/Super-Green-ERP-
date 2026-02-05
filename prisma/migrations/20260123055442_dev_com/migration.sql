/*
  Warnings:

  - Added the required column `advisorId` to the `Investment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Investment" ADD COLUMN     "advisorId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "managerId" INTEGER;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

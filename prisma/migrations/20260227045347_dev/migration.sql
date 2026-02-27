/*
  Warnings:

  - Added the required column `branchId` to the `Commission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Commission" ADD COLUMN     "branchId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

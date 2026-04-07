/*
  Warnings:

  - You are about to drop the column `createdById` on the `Quotation` table. All the data in the column will be lost.
  - Added the required column `createdByUserId` to the `Quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `netInterestEarned` to the `Quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `netMaturityAmount` to the `Quotation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Quotation" DROP CONSTRAINT "Quotation_createdById_fkey";

-- DropIndex
DROP INDEX "Quotation_createdById_idx";

-- AlterTable
ALTER TABLE "Quotation" DROP COLUMN "createdById",
ADD COLUMN     "createdByUserId" UUID NOT NULL,
ADD COLUMN     "documentCharge" DOUBLE PRECISION NOT NULL DEFAULT 500,
ADD COLUMN     "netInterestEarned" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "netMaturityAmount" DOUBLE PRECISION NOT NULL;

-- CreateIndex
CREATE INDEX "Quotation_createdByUserId_idx" ON "Quotation"("createdByUserId");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

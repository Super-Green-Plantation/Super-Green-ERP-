/*
  Warnings:

  - You are about to alter the column `rate` on the `CommissionRate` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `rate` on the `PersonalCommissionTier` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "CommissionRate" ALTER COLUMN "rate" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "PersonalCommissionTier" ALTER COLUMN "rate" SET DATA TYPE DECIMAL(65,30);

-- CreateIndex
CREATE INDEX "Commission_investmentId_idx" ON "Commission"("investmentId");

-- CreateIndex
CREATE INDEX "Commission_memberEmpNo_idx" ON "Commission"("memberEmpNo");

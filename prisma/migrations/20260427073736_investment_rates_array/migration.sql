/*
  Warnings:

  - You are about to drop the column `paymentSlip` on the `ClientDocument` table. All the data in the column will be lost.
  - The `rate` column on the `FinancialPlan` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `investmentRate` on the `Investment` table. All the data in the column will be lost.

*/
-- AlterTable
-- Add the new array column
ALTER TABLE "Investment" ADD COLUMN "investmentRates" DOUBLE PRECISION[] NOT NULL DEFAULT '{}';

-- Migrate existing scalar rate into a 1-element array
-- (we don't know the plan's year count at migration time, so wrap in array for now)
UPDATE "Investment"
SET "investmentRates" = ARRAY["investmentRate"]
WHERE "investmentRate" IS NOT NULL;

-- NOW drop the old column (Prisma may have already put this below — keep it after the UPDATE)
ALTER TABLE "Investment" DROP COLUMN "investmentRate";
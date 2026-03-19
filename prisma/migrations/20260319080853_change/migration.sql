/*
  Warnings:

  - You are about to alter the column `rateNonPermanent` on the `CommissionRate` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `ratePermanent` on the `CommissionRate` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "CommissionRate" ALTER COLUMN "rateNonPermanent" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "ratePermanent" SET DATA TYPE DOUBLE PRECISION;

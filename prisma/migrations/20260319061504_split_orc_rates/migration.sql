/*
  Warnings:

  - You are about to drop the column `rate` on the `CommissionRate` table. All the data in the column will be lost.
  - You are about to drop the column `orcRate` on the `PositionSalary` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CommissionRate" DROP COLUMN "rate",
ADD COLUMN     "rateNonPermanent" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "ratePermanent" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PositionSalary" DROP COLUMN "orcRate";

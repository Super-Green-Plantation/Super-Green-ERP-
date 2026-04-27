/*
  Warnings:

  - You are about to drop the column `paymentSlip` on the `ClientDocument` table. All the data in the column will be lost.
  - The `rate` column on the `FinancialPlan` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ClientDocument" DROP COLUMN "paymentSlip";

-- AlterTable
ALTER TABLE "FinancialPlan" DROP COLUMN "rate",
ADD COLUMN     "rate" DOUBLE PRECISION[];

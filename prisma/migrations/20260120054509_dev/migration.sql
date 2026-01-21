/*
  Warnings:

  - Added the required column `empNo` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FinancialPlan" ADD COLUMN     "investment" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "empNo" TEXT NOT NULL;

/*
  Warnings:

  - You are about to drop the column `basicSalary` on the `MonthlyPayroll` table. All the data in the column will be lost.
  - You are about to alter the column `basicSalaryPermanent` on the `PositionSalary` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `basicSalaryProbation` on the `PositionSalary` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "MonthlyPayroll" DROP COLUMN "basicSalary",
ADD COLUMN     "basicSalaryPermanent" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PositionSalary" ALTER COLUMN "basicSalaryPermanent" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "basicSalaryProbation" SET DATA TYPE DOUBLE PRECISION;

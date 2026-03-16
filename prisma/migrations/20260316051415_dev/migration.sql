-- AlterTable
ALTER TABLE "PositionSalary" ADD COLUMN     "basicSalaryPermanent" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "basicSalaryProbation" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PositionSalary" ADD COLUMN     "allowanceThresholdPermanent" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "allowanceThresholdProbation" DOUBLE PRECISION NOT NULL DEFAULT 0.75;

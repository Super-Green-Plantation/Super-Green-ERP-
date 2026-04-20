-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "monthlyHarvest" INTEGER,
ADD COLUMN     "totalHarvest" INTEGER;

-- AlterTable
ALTER TABLE "Investment" ADD COLUMN     "investmentRate" DOUBLE PRECISION;

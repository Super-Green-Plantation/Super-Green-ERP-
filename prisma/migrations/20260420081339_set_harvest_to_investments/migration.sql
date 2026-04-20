/*
  Warnings:

  - You are about to drop the column `monthlyHarvest` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `totalHarvest` on the `Client` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "monthlyHarvest",
DROP COLUMN "totalHarvest";

-- AlterTable
ALTER TABLE "Investment" ADD COLUMN     "monthlyHarvest" DOUBLE PRECISION,
ADD COLUMN     "totalHarvest" DOUBLE PRECISION;

/*
  Warnings:

  - A unique constraint covering the columns `[refNumber]` on the table `Commission` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Commission" ADD COLUMN     "refNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Commission_refNumber_key" ON "Commission"("refNumber");

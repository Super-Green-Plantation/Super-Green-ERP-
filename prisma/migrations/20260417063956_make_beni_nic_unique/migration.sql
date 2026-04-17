/*
  Warnings:

  - A unique constraint covering the columns `[nic]` on the table `Beneficiary` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Beneficiary_nic_key" ON "Beneficiary"("nic");

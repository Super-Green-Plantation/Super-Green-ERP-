/*
  Warnings:

  - A unique constraint covering the columns `[nic]` on the table `Nominee` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Nominee_nic_key" ON "Nominee"("nic");

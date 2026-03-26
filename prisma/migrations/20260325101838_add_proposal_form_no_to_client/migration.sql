/*
  Warnings:

  - A unique constraint covering the columns `[proposalFormNo]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "proposalFormNo" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_proposalFormNo_key" ON "Client"("proposalFormNo");

/*
  Warnings:

  - Made the column `nic` on table `Beneficiary` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Beneficiary" ALTER COLUMN "nic" SET NOT NULL;

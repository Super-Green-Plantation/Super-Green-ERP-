/*
  Warnings:

  - You are about to drop the column `rate` on the `Investment` table. All the data in the column will be lost.
  - You are about to drop the column `returnFrequency` on the `Investment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Investment" DROP COLUMN "rate",
DROP COLUMN "returnFrequency";

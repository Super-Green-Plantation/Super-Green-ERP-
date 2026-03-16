/*
  Warnings:

  - You are about to drop the `PersonalCommissionTier` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PersonalCommissionTier" DROP CONSTRAINT "PersonalCommissionTier_positionId_fkey";

-- DropTable
DROP TABLE "PersonalCommissionTier";

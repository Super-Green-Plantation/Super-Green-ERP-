/*
  Warnings:

  - You are about to drop the `PositionPermanentTarget` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PositionPermanentTarget" DROP CONSTRAINT "PositionPermanentTarget_positionId_fkey";

-- DropTable
DROP TABLE "PositionPermanentTarget";

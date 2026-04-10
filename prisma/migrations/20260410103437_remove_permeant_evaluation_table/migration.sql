/*
  Warnings:

  - You are about to drop the `PermanentEvaluation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PermanentEvaluation" DROP CONSTRAINT "PermanentEvaluation_memberId_fkey";

-- DropTable
DROP TABLE "PermanentEvaluation";

/*
  Warnings:

  - You are about to drop the column `proposalForm` on the `Client` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "proposalForm",
ADD COLUMN     "proposal" TEXT;

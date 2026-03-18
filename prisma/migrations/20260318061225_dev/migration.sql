/*
  Warnings:

  - Made the column `epfNo` on table `Member` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "phone2" TEXT,
ALTER COLUMN "epfNo" SET NOT NULL;

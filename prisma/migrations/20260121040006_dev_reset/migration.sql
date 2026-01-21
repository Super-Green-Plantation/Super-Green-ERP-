/*
  Warnings:

  - Made the column `title` on table `Position` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Position" ALTER COLUMN "title" SET NOT NULL;

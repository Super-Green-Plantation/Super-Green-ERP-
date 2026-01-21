/*
  Warnings:

  - A unique constraint covering the columns `[empNo]` on the table `Member` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Position"
ALTER COLUMN "title"
TYPE "Title"
USING "title"[1]::"Title";


-- CreateIndex
CREATE UNIQUE INDEX "Member_empNo_key" ON "Member"("empNo");

/*
  Warnings:

  - A unique constraint covering the columns `[rank]` on the table `Position` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rank` to the `Position` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "rank" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Position_rank_key" ON "Position"("rank");

/*
  Warnings:

  - The `title` column on the `Position` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Title" AS ENUM ('AGM', 'ZM', 'RM', 'BM', 'TL', 'FA');

-- AlterTable
ALTER TABLE "Position" DROP COLUMN "title",
ADD COLUMN     "title" "Title"[];

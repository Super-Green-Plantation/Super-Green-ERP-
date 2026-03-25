/*
  Warnings:

  - The values [ZM,RM,BM] on the enum `Title` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Title_new" AS ENUM ('ADMIN', 'AGM', 'JZM', 'SZM', 'JRM', 'SRM', 'JBM', 'SBM', 'TL', 'FA');
ALTER TABLE "Position" ALTER COLUMN "title" TYPE "Title_new" USING ("title"::text::"Title_new");
ALTER TYPE "Title" RENAME TO "Title_old";
ALTER TYPE "Title_new" RENAME TO "Title";
DROP TYPE "public"."Title_old";
COMMIT;

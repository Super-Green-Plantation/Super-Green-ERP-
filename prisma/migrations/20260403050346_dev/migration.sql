/*
  Warnings:

  - The values [ACCOUNTS] on the enum `Title` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Title_new" AS ENUM ('ADMIN', 'CHAIRMEN', 'COO', 'GM', 'HR', 'ACC', 'IT', 'ABM', 'PRO', 'OPM', 'CLEANING', 'FA', 'TL', 'BM', 'RM', 'ZM', 'P_AGM', 'TRAINEE_FA', 'P_FA', 'P_TL', 'JBM', 'SBM', 'JRM', 'SRM', 'JZM', 'SZM', 'AGM', 'SE');
ALTER TABLE "Position" ALTER COLUMN "title" TYPE "Title_new" USING ("title"::text::"Title_new");
ALTER TYPE "Title" RENAME TO "Title_old";
ALTER TYPE "Title_new" RENAME TO "Title";
DROP TYPE "public"."Title_old";
COMMIT;

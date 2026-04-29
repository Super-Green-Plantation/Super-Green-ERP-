-- Step 1: Add new values
ALTER TYPE "Title" ADD VALUE 'PRO_AGM';
ALTER TYPE "Title" ADD VALUE 'PER_AGM';

-- Step 2: Migrate existing data BEFORE dropping AGM
-- Based on isProbation flag:
UPDATE "Position" SET title = 'PRO_AGM' WHERE title = 'AGM' AND "isProbation" = true;
UPDATE "Position" SET title = 'PER_AGM' WHERE title = 'AGM' AND "isProbation" = false;

-- Step 3: Recreate the enum without AGM
ALTER TYPE "Title" RENAME TO "Title_old";

CREATE TYPE "Title" AS ENUM (
  'ADMIN', 'CHAIRMEN', 'HR', 'ACC', 'IT', 'ABM', 'PRO', 'OPM', 'CLEANING',
  'FA', 'TL', 'BM', 'RM', 'ZM', 'PRO_AGM',
  'TRAINEE_FA', 'P_FA', 'P_TL', 'JBM', 'SBM', 'JRM', 'SRM', 'JZM', 'SZM',
  'PER_AGM', 'COO', 'DGM', 'GM', 'SE'
);

ALTER TABLE "Position"
  ALTER COLUMN title TYPE "Title"
  USING title::text::"Title";

DROP TYPE "Title_old";
-- This migration assumes PRO_AGM and PER_AGM may or may not exist yet
-- Safe to replay from scratch on shadow database

DO $$ BEGIN
  -- Add enum values if not present (shadow db replay path)
  IF NOT EXISTS (SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'Title' AND e.enumlabel = 'PRO_AGM') THEN
    ALTER TYPE "Title" ADD VALUE 'PRO_AGM';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'Title' AND e.enumlabel = 'PER_AGM') THEN
    ALTER TYPE "Title" ADD VALUE 'PER_AGM';
  END IF;
END $$;

-- Recreate enum without AGM (drop/recreate pattern)
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
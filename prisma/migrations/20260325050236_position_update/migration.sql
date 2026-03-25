-- CreateEnum
CREATE TYPE "PositionType" AS ENUM ('PROBATION', 'PERMANENT', 'MANAGEMENT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Title" ADD VALUE 'HR';
ALTER TYPE "Title" ADD VALUE 'ACCOUNTS';
ALTER TYPE "Title" ADD VALUE 'IT';
ALTER TYPE "Title" ADD VALUE 'BM';
ALTER TYPE "Title" ADD VALUE 'RM';
ALTER TYPE "Title" ADD VALUE 'ZM';
ALTER TYPE "Title" ADD VALUE 'P_AGM';
ALTER TYPE "Title" ADD VALUE 'TRAINEE_FA';
ALTER TYPE "Title" ADD VALUE 'P_FA';
ALTER TYPE "Title" ADD VALUE 'P_TL';

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "isManagement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isProbation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" "PositionType" NOT NULL DEFAULT 'PROBATION';

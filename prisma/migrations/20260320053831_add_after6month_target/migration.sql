-- AlterTable
ALTER TABLE "PositionTarget" ADD COLUMN     "after6MonthTarget" DOUBLE PRECISION NOT NULL DEFAULT 0;
-- First add as nullable
ALTER TABLE "Beneficiary" ADD COLUMN "investmentId" INTEGER;
ALTER TABLE "Nominee" ADD COLUMN "investmentId" INTEGER;

-- Migrate existing data: link to the first investment of the client
UPDATE "Beneficiary" b
SET "investmentId" = (
  SELECT i.id FROM "Investment" i 
  WHERE i."clientId" = b."clientId" 
  ORDER BY i."createdAt" ASC 
  LIMIT 1
);

UPDATE "Nominee" n
SET "investmentId" = (
  SELECT i.id FROM "Investment" i 
  WHERE i."clientId" = n."clientId" 
  ORDER BY i."createdAt" ASC 
  LIMIT 1
);

-- Then drop old column and add constraints
ALTER TABLE "Beneficiary" DROP COLUMN "clientId";
ALTER TABLE "Nominee" DROP COLUMN "clientId";
ALTER TABLE "Beneficiary" ALTER COLUMN "investmentId" SET NOT NULL;
ALTER TABLE "Nominee" ALTER COLUMN "investmentId" SET NOT NULL;
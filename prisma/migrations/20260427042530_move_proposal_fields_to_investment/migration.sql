/*
  Warnings:

  - You are about to drop the column `agreement` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `investmentAmount` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `paymentSlip` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `proposal` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `proposalFormNo` on the `Client` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[proposalFormNo]` on the table `Investment` will be added. If there are existing duplicate values, this will fail.

*/
-- Step 1: Add new columns to Investment (nullable to avoid breaking existing rows)
ALTER TABLE "Investment"
  ADD COLUMN "proposalFormNo" TEXT,
  ADD COLUMN "proposal"       TEXT,
  ADD COLUMN "agreement"      TEXT,
  ADD COLUMN "paymentSlip"    TEXT;

-- Step 2: Copy data from Client → Investment
-- Strategy: copy to the latest investment per client
UPDATE "Investment" i
SET
  "proposalFormNo" = c."proposalFormNo",
  "proposal"       = c."proposal",
  "agreement"      = c."agreement",
  "paymentSlip"    = c."paymentSlip"
FROM "Client" c
WHERE i."clientId" = c.id
  AND i.id = (
    SELECT id FROM "Investment"
    WHERE "clientId" = c.id
    ORDER BY "investmentDate" DESC
    LIMIT 1
  );

-- Step 3: Add unique constraint on proposalFormNo (after data is copied, nulls are fine)
CREATE UNIQUE INDEX "Investment_proposalFormNo_key"
  ON "Investment"("proposalFormNo")
  WHERE "proposalFormNo" IS NOT NULL;

-- Step 4: Drop the old columns from Client
ALTER TABLE "Client"
  DROP COLUMN "proposalFormNo",
  DROP COLUMN "proposal",
  DROP COLUMN "agreement",
  DROP COLUMN "paymentSlip";
/*
  Warnings:

  - You are about to drop the column `investmentId` on the `Beneficiary` table. All the data in the column will be lost.
  - You are about to drop the column `investmentId` on the `Nominee` table. All the data in the column will be lost.
  - Added the required column `clientId` to the `Beneficiary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `Nominee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Beneficiary" DROP COLUMN "investmentId",
ADD COLUMN     "clientId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Investment" ADD COLUMN     "beneficiaryId" INTEGER,
ADD COLUMN     "nomineeId" INTEGER;

-- AlterTable
ALTER TABLE "Nominee" DROP COLUMN "investmentId",
ADD COLUMN     "clientId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nominee" ADD CONSTRAINT "Nominee_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_nomineeId_fkey" FOREIGN KEY ("nomineeId") REFERENCES "Nominee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `name` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Client` table. All the data in the column will be lost.
  - The `status` column on the `FinancialPlan` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[nic]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[drivingLicense]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passportNo]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fullName` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneMobile` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Made the column `address` on table `Client` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ReturnFrequency" AS ENUM ('Monthly', 'HalfYearly', 'Yearly');

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "name",
DROP COLUMN "phone",
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "drivingLicense" TEXT,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "nic" TEXT,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "passportNo" TEXT,
ADD COLUMN     "phoneLand" TEXT,
ADD COLUMN     "phoneMobile" TEXT NOT NULL,
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'Active',
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "address" SET NOT NULL;

-- AlterTable
ALTER TABLE "FinancialPlan" DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'Active';

-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "nic" TEXT,
    "phone" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankBranch" TEXT NOT NULL,
    "accountNo" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nominee" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "permanentAddress" TEXT NOT NULL,
    "postalAddress" TEXT,
    "clientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nominee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" SERIAL NOT NULL,
    "investmentDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "returnFrequency" "ReturnFrequency" NOT NULL,
    "clientId" INTEGER NOT NULL,
    "planId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Beneficiary_clientId_key" ON "Beneficiary"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Nominee_clientId_key" ON "Nominee"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_nic_key" ON "Client"("nic");

-- CreateIndex
CREATE UNIQUE INDEX "Client_drivingLicense_key" ON "Client"("drivingLicense");

-- CreateIndex
CREATE UNIQUE INDEX "Client_passportNo_key" ON "Client"("passportNo");

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nominee" ADD CONSTRAINT "Nominee_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "FinancialPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

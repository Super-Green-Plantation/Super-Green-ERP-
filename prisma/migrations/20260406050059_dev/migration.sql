-- CreateEnum
CREATE TYPE "QuotationPlanType" AS ENUM ('CHILD', 'MARGE', 'PENSION');

-- CreateEnum
CREATE TYPE "QuotationFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL');

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientNic" TEXT,
    "clientAge" INTEGER,
    "planType" "QuotationPlanType" NOT NULL,
    "frequency" "QuotationFrequency" NOT NULL,
    "duration" INTEGER NOT NULL,
    "premium" DOUBLE PRECISION NOT NULL,
    "retirementAge" INTEGER,
    "totalInvested" DOUBLE PRECISION NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "interestEarned" DOUBLE PRECISION NOT NULL,
    "maturityAmount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Quotation_createdById_idx" ON "Quotation"("createdById");

-- CreateIndex
CREATE INDEX "Quotation_planType_idx" ON "Quotation"("planType");

-- CreateIndex
CREATE INDEX "Quotation_createdAt_idx" ON "Quotation"("createdAt");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

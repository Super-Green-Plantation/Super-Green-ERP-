/*
  Warnings:

  - The values [Renew] on the enum `InvStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "Channel" ADD VALUE 'Chanel_03';

-- AlterEnum
BEGIN;
CREATE TYPE "InvStatus_new" AS ENUM ('Active', 'Inactive', 'Matured', 'Renewed');
ALTER TABLE "public"."Investment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Investment" ALTER COLUMN "status" TYPE "InvStatus_new" USING ("status"::text::"InvStatus_new");
ALTER TYPE "InvStatus" RENAME TO "InvStatus_old";
ALTER TYPE "InvStatus_new" RENAME TO "InvStatus";
DROP TYPE "public"."InvStatus_old";
ALTER TABLE "Investment" ALTER COLUMN "status" SET DEFAULT 'Active';
COMMIT;

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "zoneId" INTEGER;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Investment" ADD COLUMN     "agmId" INTEGER,
ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "bmId" INTEGER,
ADD COLUMN     "ccoId" INTEGER,
ADD COLUMN     "createdById" INTEGER,
ADD COLUMN     "faId" INTEGER,
ADD COLUMN     "fmId" INTEGER,
ADD COLUMN     "renewedFromId" INTEGER,
ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "rmId" INTEGER,
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "zmId" INTEGER;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "recruitedById" INTEGER,
ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "MonthlyPayroll" ADD COLUMN     "activationAllowanceEarned" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PositionSalary" ADD COLUMN     "incentivePartialAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "incentivePartialThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
ADD COLUMN     "minActiveAdvisors" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "minActiveBMs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "minActiveFMs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "teamActiveAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "teamActiveThresholdPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "vehicleAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "vehicleThresholdPct" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Zone" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberZone" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "zoneId" INTEGER NOT NULL,

    CONSTRAINT "MemberZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyActivation" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "activationCount" INTEGER NOT NULL DEFAULT 0,
    "isActivated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyActivation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Zone_name_key" ON "Zone"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MemberZone_memberId_zoneId_key" ON "MemberZone"("memberId", "zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyActivation_memberId_year_month_key" ON "MonthlyActivation"("memberId", "year", "month");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberZone" ADD CONSTRAINT "MemberZone_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberZone" ADD CONSTRAINT "MemberZone_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_recruitedById_fkey" FOREIGN KEY ("recruitedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_renewedFromId_fkey" FOREIGN KEY ("renewedFromId") REFERENCES "Investment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_faId_fkey" FOREIGN KEY ("faId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_fmId_fkey" FOREIGN KEY ("fmId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_bmId_fkey" FOREIGN KEY ("bmId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_rmId_fkey" FOREIGN KEY ("rmId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_zmId_fkey" FOREIGN KEY ("zmId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_agmId_fkey" FOREIGN KEY ("agmId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_ccoId_fkey" FOREIGN KEY ("ccoId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyActivation" ADD CONSTRAINT "MonthlyActivation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `name` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `phone2` on the `Member` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('PROBATION', 'PERMANENT');

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "name",
DROP COLUMN "phone2",
ADD COLUMN     "probationStartDate" TIMESTAMP(3),
ADD COLUMN     "profilePic" TEXT,
ADD COLUMN     "status" "EmployeeStatus" NOT NULL DEFAULT 'PROBATION';

-- CreateTable
CREATE TABLE "PositionTarget" (
    "id" SERIAL NOT NULL,
    "positionId" INTEGER NOT NULL,
    "periodNumber" INTEGER NOT NULL,
    "monthNumber" INTEGER NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "bonusAmount" DOUBLE PRECISION NOT NULL,
    "excessRate" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "PositionTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyEvaluation" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "periodNumber" INTEGER,
    "monthInPeriod" INTEGER,
    "volumeAchieved" DOUBLE PRECISION NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "bonusEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "excessBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetHit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PositionTarget_positionId_periodNumber_monthNumber_key" ON "PositionTarget"("positionId", "periodNumber", "monthNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyEvaluation_memberId_year_month_key" ON "MonthlyEvaluation"("memberId", "year", "month");

-- AddForeignKey
ALTER TABLE "PositionTarget" ADD CONSTRAINT "PositionTarget_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyEvaluation" ADD CONSTRAINT "MonthlyEvaluation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

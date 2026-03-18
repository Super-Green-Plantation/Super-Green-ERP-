-- CreateTable
CREATE TABLE "PositionPermanentTarget" (
    "id" SERIAL NOT NULL,
    "positionId" INTEGER NOT NULL,
    "monthlyTarget" DOUBLE PRECISION NOT NULL,
    "incentiveThreshold" DOUBLE PRECISION NOT NULL,
    "incentiveAmount" DOUBLE PRECISION NOT NULL,
    "allowanceThreshold" DOUBLE PRECISION NOT NULL,
    "allowanceAmount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PositionPermanentTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermanentEvaluation" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "volumeAchieved" DOUBLE PRECISION NOT NULL,
    "monthlyTarget" DOUBLE PRECISION NOT NULL,
    "incentiveEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allowanceEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "incentiveHit" BOOLEAN NOT NULL DEFAULT false,
    "allowanceHit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermanentEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionSalary" (
    "id" SERIAL NOT NULL,
    "positionId" INTEGER NOT NULL,
    "basicSalary" DOUBLE PRECISION NOT NULL,
    "monthlyTarget" DOUBLE PRECISION NOT NULL,
    "incentiveAmount" DOUBLE PRECISION NOT NULL,
    "allowanceAmount" DOUBLE PRECISION NOT NULL,
    "orcRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commRateLow" DOUBLE PRECISION NOT NULL,
    "commRateHigh" DOUBLE PRECISION NOT NULL,
    "commThreshold" DOUBLE PRECISION NOT NULL DEFAULT 500000,
    "epfEmployee" DOUBLE PRECISION NOT NULL DEFAULT 0.08,
    "epfEmployer" DOUBLE PRECISION NOT NULL DEFAULT 0.12,
    "etfEmployer" DOUBLE PRECISION NOT NULL DEFAULT 0.03,

    CONSTRAINT "PositionSalary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyPayroll" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "basicSalary" DOUBLE PRECISION NOT NULL,
    "volumeAchieved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyTarget" DOUBLE PRECISION NOT NULL,
    "incentiveEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allowanceEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orcEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "epfDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "epfEmployer" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "etfEmployer" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "incentiveHit" BOOLEAN NOT NULL DEFAULT false,
    "allowanceHit" BOOLEAN NOT NULL DEFAULT false,
    "grossPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyPayroll_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PositionPermanentTarget_positionId_key" ON "PositionPermanentTarget"("positionId");

-- CreateIndex
CREATE UNIQUE INDEX "PermanentEvaluation_memberId_year_month_key" ON "PermanentEvaluation"("memberId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "PositionSalary_positionId_key" ON "PositionSalary"("positionId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyPayroll_memberId_year_month_key" ON "MonthlyPayroll"("memberId", "year", "month");

-- AddForeignKey
ALTER TABLE "PositionPermanentTarget" ADD CONSTRAINT "PositionPermanentTarget_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermanentEvaluation" ADD CONSTRAINT "PermanentEvaluation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionSalary" ADD CONSTRAINT "PositionSalary_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyPayroll" ADD CONSTRAINT "MonthlyPayroll_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

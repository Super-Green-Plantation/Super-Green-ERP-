CREATE TABLE "BranchMonthlyTarget" (
    "id" SERIAL NOT NULL,
    "branchId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchMonthlyTarget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BranchMonthlyTarget_branchId_year_month_key"
ON "BranchMonthlyTarget"("branchId", "year", "month");

ALTER TABLE "BranchMonthlyTarget"
ADD CONSTRAINT "BranchMonthlyTarget_branchId_fkey"
FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

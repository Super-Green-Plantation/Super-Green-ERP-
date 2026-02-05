-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERSONAL', 'UPLINE');

-- CreateTable
CREATE TABLE "Commission" (
    "id" SERIAL NOT NULL,
    "investmentId" INTEGER NOT NULL,
    "memberEmpNo" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "CommissionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Commission_investmentId_key" ON "Commission"("investmentId");

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

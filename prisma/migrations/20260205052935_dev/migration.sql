-- CreateTable
CREATE TABLE "Profit" (
    "id" SERIAL NOT NULL,
    "investmentId" INTEGER NOT NULL,
    "investmentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionPayout" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Profit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profit_investmentId_key" ON "Profit"("investmentId");

-- AddForeignKey
ALTER TABLE "Profit" ADD CONSTRAINT "Profit_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

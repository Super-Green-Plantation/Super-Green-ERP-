-- CreateTable
CREATE TABLE "PersonalCommissionTier" (
    "id" SERIAL NOT NULL,
    "positionId" INTEGER NOT NULL,
    "minAmount" DOUBLE PRECISION NOT NULL,
    "maxAmount" DOUBLE PRECISION,
    "rate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PersonalCommissionTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonalCommissionTier_positionId_idx" ON "PersonalCommissionTier"("positionId");

-- AddForeignKey
ALTER TABLE "PersonalCommissionTier" ADD CONSTRAINT "PersonalCommissionTier_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

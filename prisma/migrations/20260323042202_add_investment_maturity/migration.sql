-- AlterTable
ALTER TABLE "Investment" ADD COLUMN     "isMatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maturityDate" TIMESTAMP(3),
ADD COLUMN     "maturityNotified" BOOLEAN NOT NULL DEFAULT false;

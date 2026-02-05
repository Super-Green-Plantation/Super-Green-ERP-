-- DropForeignKey
ALTER TABLE "Commission" DROP CONSTRAINT "Commission_investmentId_fkey";

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

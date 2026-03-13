-- DropForeignKey
ALTER TABLE "Investment" DROP CONSTRAINT "Investment_advisorId_fkey";

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

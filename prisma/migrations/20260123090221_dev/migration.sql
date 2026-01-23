-- DropForeignKey
ALTER TABLE "Investment" DROP CONSTRAINT "Investment_advisorId_fkey";

-- AlterTable
ALTER TABLE "Investment" ALTER COLUMN "advisorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

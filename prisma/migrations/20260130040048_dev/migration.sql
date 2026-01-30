-- DropForeignKey
ALTER TABLE "Investment" DROP CONSTRAINT "Investment_clientId_fkey";

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

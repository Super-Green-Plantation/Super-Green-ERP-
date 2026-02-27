-- DropForeignKey
ALTER TABLE "ClientDocumentRequest" DROP CONSTRAINT "ClientDocumentRequest_clientId_fkey";

-- AddForeignKey
ALTER TABLE "ClientDocumentRequest" ADD CONSTRAINT "ClientDocumentRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

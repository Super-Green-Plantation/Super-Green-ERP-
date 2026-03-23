-- DropForeignKey
ALTER TABLE "ClientDocumentRequest" DROP CONSTRAINT "ClientDocumentRequest_createdById_fkey";

-- AddForeignKey
ALTER TABLE "ClientDocumentRequest" ADD CONSTRAINT "ClientDocumentRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

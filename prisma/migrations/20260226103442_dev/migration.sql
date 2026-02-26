-- CreateTable
CREATE TABLE "ClientDocumentRequest" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "createdById" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientDocumentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientDocument" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "idFront" TEXT,
    "idBack" TEXT,
    "paySlip" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientDocumentRequest_token_key" ON "ClientDocumentRequest"("token");

-- AddForeignKey
ALTER TABLE "ClientDocumentRequest" ADD CONSTRAINT "ClientDocumentRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDocumentRequest" ADD CONSTRAINT "ClientDocumentRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDocument" ADD CONSTRAINT "ClientDocument_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ClientDocumentRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

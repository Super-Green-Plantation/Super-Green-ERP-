/*
  Warnings:

  - You are about to drop the column `paySlip` on the `ClientDocument` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `Member` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ZONAL_MANAGER';

-- AlterTable
ALTER TABLE "ClientDocument" DROP COLUMN "paySlip",
ADD COLUMN     "paymentSlip" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

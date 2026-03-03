/*
  Warnings:

  - You are about to drop the column `branchId` on the `Member` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "Member_branchId_fkey";

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "branchId";

-- CreateTable
CREATE TABLE "MemberBranch" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,

    CONSTRAINT "MemberBranch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberBranch_memberId_branchId_key" ON "MemberBranch"("memberId", "branchId");

-- AddForeignKey
ALTER TABLE "MemberBranch" ADD CONSTRAINT "MemberBranch_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberBranch" ADD CONSTRAINT "MemberBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

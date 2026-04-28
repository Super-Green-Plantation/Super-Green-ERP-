-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('Chanel_01', 'Chanel_02', 'Micro');

-- CreateEnum
CREATE TYPE "InvStatus" AS ENUM ('Active', 'Inactive', 'Renew');

-- AlterTable
ALTER TABLE "Investment" ADD COLUMN     "status" "InvStatus" NOT NULL DEFAULT 'Active';

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "channel" "Channel" NOT NULL DEFAULT 'Chanel_01';

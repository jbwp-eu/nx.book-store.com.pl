-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetExpires" TIMESTAMP(6),
ADD COLUMN     "passwordResetToken" TEXT;

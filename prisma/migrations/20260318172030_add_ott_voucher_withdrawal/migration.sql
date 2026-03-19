/*
  Warnings:

  - A unique constraint covering the columns `[ottUniqueRef]` on the table `Withdrawal` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "WithdrawalMethod" ADD VALUE 'OTT_VOUCHER';

-- AlterTable
ALTER TABLE "Tip" ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "followUpSentAt" TIMESTAMP(3),
ADD COLUMN     "paymentLinkUrl" TEXT,
ADD COLUMN     "whatsappLinkSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "ottUniqueRef" TEXT,
ADD COLUMN     "ottVoucherAmount" DECIMAL(12,2),
ADD COLUMN     "ottVoucherId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Withdrawal_ottUniqueRef_key" ON "Withdrawal"("ottUniqueRef");

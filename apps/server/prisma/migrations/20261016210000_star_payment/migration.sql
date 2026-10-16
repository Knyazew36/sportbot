-- CreateEnum
CREATE TYPE "StarPaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- CreateTable
CREATE TABLE "StarPayment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" "StarPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "telegramChargeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "StarPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StarPayment_telegramChargeId_key" ON "StarPayment"("telegramChargeId");

-- CreateIndex
CREATE INDEX "StarPayment_userId_idx" ON "StarPayment"("userId");

-- CreateIndex
CREATE INDEX "StarPayment_status_createdAt_idx" ON "StarPayment"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "StarPayment" ADD CONSTRAINT "StarPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

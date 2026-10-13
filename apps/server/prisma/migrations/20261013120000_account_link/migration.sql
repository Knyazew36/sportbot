-- Привязка второго мессенджера (Б15а): код привязки и выбор, куда бот пишет сам.

-- AlterTable
ALTER TABLE "SportProfile" ADD COLUMN "notifyChannels" "BotChannel"[] DEFAULT ARRAY[]::"BotChannel"[];

-- CreateTable
CREATE TABLE "AccountLinkCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "channel" "BotChannel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountLinkCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountLinkCode_code_key" ON "AccountLinkCode"("code");

-- CreateIndex
CREATE INDEX "AccountLinkCode_userId_idx" ON "AccountLinkCode"("userId");

-- AddForeignKey
ALTER TABLE "AccountLinkCode" ADD CONSTRAINT "AccountLinkCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

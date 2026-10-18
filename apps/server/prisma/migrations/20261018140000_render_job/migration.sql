-- CreateEnum
CREATE TYPE "RenderStatus" AS ENUM ('QUEUED', 'RENDERING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "RenderDelivery" AS ENUM ('CHAT', 'DOWNLOAD');

-- CreateTable
CREATE TABLE "RenderJob" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "compositionId" TEXT NOT NULL,
    "props" JSONB NOT NULL,
    "format" TEXT NOT NULL,
    "delivery" "RenderDelivery" NOT NULL,
    "channel" "BotChannel",
    "status" "RenderStatus" NOT NULL DEFAULT 'QUEUED',
    "filePath" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RenderJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RenderJob_userId_createdAt_idx" ON "RenderJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RenderJob_status_createdAt_idx" ON "RenderJob"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "RenderJob" ADD CONSTRAINT "RenderJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

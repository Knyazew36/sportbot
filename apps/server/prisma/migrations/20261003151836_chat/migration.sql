-- CreateTable
CREATE TABLE "ChatSubmission" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "filePaths" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatSubmission_createdAt_idx" ON "ChatSubmission"("createdAt");

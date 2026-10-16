-- CreateEnum
CREATE TYPE "ProgramPublication" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED');

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "publication" "ProgramPublication" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "publishedDescription" TEXT,
ADD COLUMN     "publishedName" TEXT,
ADD COLUMN     "rejectReason" TEXT,
ADD COLUMN     "reviewRequestedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProgramTag" ADD COLUMN     "authorId" INTEGER,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Program_publication_publishedAt_idx" ON "Program"("publication", "publishedAt");

-- CreateIndex
CREATE INDEX "ProgramTag_isApproved_idx" ON "ProgramTag"("isApproved");

-- AddForeignKey
ALTER TABLE "ProgramTag" ADD CONSTRAINT "ProgramTag_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

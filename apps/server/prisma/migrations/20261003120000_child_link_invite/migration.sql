-- CreateTable
CREATE TABLE "ChildLinkInvite" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "childUserId" INTEGER NOT NULL,
    "createdByUserId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildLinkInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChildLinkInvite_token_key" ON "ChildLinkInvite"("token");

-- CreateIndex
CREATE INDEX "ChildLinkInvite_childUserId_idx" ON "ChildLinkInvite"("childUserId");

-- AddForeignKey
ALTER TABLE "ChildLinkInvite" ADD CONSTRAINT "ChildLinkInvite_childUserId_fkey" FOREIGN KEY ("childUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


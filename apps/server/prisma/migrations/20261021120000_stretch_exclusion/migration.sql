-- Исключённые растяжки: не попадают в заминку, пока человек их не вернёт
CREATE TABLE "StretchExclusion" (
    "userId" INTEGER NOT NULL,
    "stretchId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StretchExclusion_pkey" PRIMARY KEY ("userId","stretchId")
);

CREATE INDEX "StretchExclusion_stretchId_idx" ON "StretchExclusion"("stretchId");

ALTER TABLE "StretchExclusion" ADD CONSTRAINT "StretchExclusion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StretchExclusion" ADD CONSTRAINT "StretchExclusion_stretchId_fkey" FOREIGN KEY ("stretchId") REFERENCES "Stretch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

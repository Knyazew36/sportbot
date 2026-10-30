-- CreateTable
CREATE TABLE "StretchRoutine" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StretchRoutine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StretchRoutineItem" (
    "id" SERIAL NOT NULL,
    "routineId" INTEGER NOT NULL,
    "stretchId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "StretchRoutineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StretchSession" (
    "id" SERIAL NOT NULL,
    "clientId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" INTEGER NOT NULL,
    "routineId" INTEGER,
    "routineName" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StretchSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StretchRoutine_code_key" ON "StretchRoutine"("code");

-- CreateIndex
CREATE INDEX "StretchRoutine_published_position_idx" ON "StretchRoutine"("published", "position");

-- CreateIndex
CREATE INDEX "StretchRoutineItem_routineId_position_idx" ON "StretchRoutineItem"("routineId", "position");

-- CreateIndex
CREATE INDEX "StretchRoutineItem_stretchId_idx" ON "StretchRoutineItem"("stretchId");

-- CreateIndex
CREATE UNIQUE INDEX "StretchRoutineItem_routineId_stretchId_key" ON "StretchRoutineItem"("routineId", "stretchId");

-- CreateIndex
CREATE UNIQUE INDEX "StretchSession_clientId_key" ON "StretchSession"("clientId");

-- CreateIndex
CREATE INDEX "StretchSession_userId_startedAt_idx" ON "StretchSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "StretchSession_userId_updatedAt_idx" ON "StretchSession"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "StretchSession_routineId_idx" ON "StretchSession"("routineId");

-- AddForeignKey
ALTER TABLE "StretchRoutineItem" ADD CONSTRAINT "StretchRoutineItem_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "StretchRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StretchRoutineItem" ADD CONSTRAINT "StretchRoutineItem_stretchId_fkey" FOREIGN KEY ("stretchId") REFERENCES "Stretch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StretchSession" ADD CONSTRAINT "StretchSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StretchSession" ADD CONSTRAINT "StretchSession_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "StretchRoutine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Надгробие для pull: у занятия свой userId, ветка ELSE в sync_tombstone подходит без правок
CREATE TRIGGER "StretchSession_sync_tombstone" AFTER DELETE ON "StretchSession"
  FOR EACH ROW EXECUTE FUNCTION sync_tombstone();

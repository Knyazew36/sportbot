
-- AlterTable
ALTER TABLE "BodyWeight" ADD COLUMN     "clientId" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Complex" ADD COLUMN     "clientId" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ComplexExercise" ADD COLUMN     "clientId" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Limitation" ADD COLUMN     "clientId" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Pause" ADD COLUMN     "clientId" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "PlanDay" ADD COLUMN     "clientId" UUID NOT NULL DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "clientId" UUID NOT NULL DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "StretchExclusion" ADD COLUMN     "clientId" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "clientId" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "WorkoutExercise" ADD COLUMN     "clientId" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Старые подходы без uuid получают его до NOT NULL
UPDATE "WorkoutSet" SET "clientId" = gen_random_uuid() WHERE "clientId" IS NULL;

-- AlterTable
ALTER TABLE "WorkoutSet" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "clientId" SET NOT NULL,
ALTER COLUMN "clientId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "WorkoutStretch" ADD COLUMN     "clientId" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- updatedAt старых строк: DEFAULT CURRENT_TIMESTAMP в колонке без пояса пишет время
-- в поясе сессии базы, а Prisma читает его как UTC — ставим UTC явно
UPDATE "BodyWeight" SET "updatedAt" = now() AT TIME ZONE 'UTC';
UPDATE "Complex" SET "updatedAt" = now() AT TIME ZONE 'UTC';
UPDATE "ComplexExercise" SET "updatedAt" = now() AT TIME ZONE 'UTC';
UPDATE "Limitation" SET "updatedAt" = now() AT TIME ZONE 'UTC';
UPDATE "Pause" SET "updatedAt" = now() AT TIME ZONE 'UTC';
UPDATE "StretchExclusion" SET "updatedAt" = now() AT TIME ZONE 'UTC';
UPDATE "Workout" SET "updatedAt" = now() AT TIME ZONE 'UTC';
UPDATE "WorkoutExercise" SET "updatedAt" = now() AT TIME ZONE 'UTC';
UPDATE "WorkoutSet" SET "updatedAt" = now() AT TIME ZONE 'UTC';
UPDATE "WorkoutStretch" SET "updatedAt" = now() AT TIME ZONE 'UTC';

-- CreateTable
CREATE TABLE "SyncTombstone" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "entity" TEXT NOT NULL,
    "clientId" UUID NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncTombstone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncOp" (
    "opId" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncOp_pkey" PRIMARY KEY ("opId")
);

-- CreateIndex
CREATE INDEX "SyncTombstone_userId_deletedAt_idx" ON "SyncTombstone"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "SyncOp_userId_createdAt_idx" ON "SyncOp"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BodyWeight_clientId_key" ON "BodyWeight"("clientId");

-- CreateIndex
CREATE INDEX "BodyWeight_userId_updatedAt_idx" ON "BodyWeight"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Complex_clientId_key" ON "Complex"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplexExercise_clientId_key" ON "ComplexExercise"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Limitation_clientId_key" ON "Limitation"("clientId");

-- CreateIndex
CREATE INDEX "Limitation_userId_updatedAt_idx" ON "Limitation"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Pause_clientId_key" ON "Pause"("clientId");

-- CreateIndex
CREATE INDEX "Pause_userId_updatedAt_idx" ON "Pause"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlanDay_clientId_key" ON "PlanDay"("clientId");

-- CreateIndex
CREATE INDEX "PlanDay_userId_updatedAt_idx" ON "PlanDay"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Program_clientId_key" ON "Program"("clientId");

-- CreateIndex
CREATE INDEX "Program_ownerId_updatedAt_idx" ON "Program"("ownerId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StretchExclusion_clientId_key" ON "StretchExclusion"("clientId");

-- CreateIndex
CREATE INDEX "StretchExclusion_userId_updatedAt_idx" ON "StretchExclusion"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Workout_clientId_key" ON "Workout"("clientId");

-- CreateIndex
CREATE INDEX "Workout_userId_updatedAt_idx" ON "Workout"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutExercise_clientId_key" ON "WorkoutExercise"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutStretch_clientId_key" ON "WorkoutStretch"("clientId");

-- AddForeignKey
ALTER TABLE "SyncOp" ADD CONSTRAINT "SyncOp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Надгробия для pull: триггер на DELETE пишет clientId удалённой строки.
-- Владелец ищется через родителя; при каскаде родитель уже удалён — строка не пишется,
-- клиент удаляет детей сам вслед за родителем. Удалённый пользователь тоже не пишется.
CREATE FUNCTION sync_tombstone() RETURNS trigger AS $$
DECLARE
  uid INTEGER;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'Program' THEN
      uid := OLD."ownerId";
    WHEN 'Complex' THEN
      SELECT p."ownerId" INTO uid FROM "Program" p WHERE p.id = OLD."programId";
    WHEN 'ComplexExercise' THEN
      SELECT p."ownerId" INTO uid FROM "Complex" c
        JOIN "Program" p ON p.id = c."programId" WHERE c.id = OLD."complexId";
    WHEN 'WorkoutExercise', 'WorkoutStretch' THEN
      SELECT w."userId" INTO uid FROM "Workout" w WHERE w.id = OLD."workoutId";
    WHEN 'WorkoutSet' THEN
      SELECT w."userId" INTO uid FROM "WorkoutExercise" we
        JOIN "Workout" w ON w.id = we."workoutId" WHERE we.id = OLD."workoutExerciseId";
    ELSE
      uid := OLD."userId";
  END CASE;

  IF uid IS NOT NULL AND EXISTS (SELECT 1 FROM "User" u WHERE u.id = uid) THEN
    -- Время в UTC явно: колонка без пояса, Prisma читает её как UTC
    INSERT INTO "SyncTombstone" ("userId", "entity", "clientId", "deletedAt")
      VALUES (uid, TG_TABLE_NAME, OLD."clientId", now() AT TIME ZONE 'UTC');
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Program_sync_tombstone" AFTER DELETE ON "Program"
  FOR EACH ROW EXECUTE FUNCTION sync_tombstone();

CREATE TRIGGER "Complex_sync_tombstone" AFTER DELETE ON "Complex"
  FOR EACH ROW EXECUTE FUNCTION sync_tombstone();

CREATE TRIGGER "ComplexExercise_sync_tombstone" AFTER DELETE ON "ComplexExercise"
  FOR EACH ROW EXECUTE FUNCTION sync_tombstone();

CREATE TRIGGER "PlanDay_sync_tombstone" AFTER DELETE ON "PlanDay"
  FOR EACH ROW EXECUTE FUNCTION sync_tombstone();

CREATE TRIGGER "Workout_sync_tombstone" AFTER DELETE ON "Workout"
  FOR EACH ROW EXECUTE FUNCTION sync_tombstone();

CREATE TRIGGER "WorkoutExercise_sync_tombstone" AFTER DELETE ON "WorkoutExercise"
  FOR EACH ROW EXECUTE FUNCTION sync_tombstone();

CREATE TRIGGER "WorkoutSet_sync_tombstone" AFTER DELETE ON "WorkoutSet"
  FOR EACH ROW EXECUTE FUNCTION sync_tombstone();

CREATE TRIGGER "WorkoutStretch_sync_tombstone" AFTER DELETE ON "WorkoutStretch"
  FOR EACH ROW EXECUTE FUNCTION sync_tombstone();

CREATE TRIGGER "Pause_sync_tombstone" AFTER DELETE ON "Pause"
  FOR EACH ROW EXECUTE FUNCTION sync_tombstone();

CREATE TRIGGER "Limitation_sync_tombstone" AFTER DELETE ON "Limitation"
  FOR EACH ROW EXECUTE FUNCTION sync_tombstone();

CREATE TRIGGER "StretchExclusion_sync_tombstone" AFTER DELETE ON "StretchExclusion"
  FOR EACH ROW EXECUTE FUNCTION sync_tombstone();

CREATE TRIGGER "BodyWeight_sync_tombstone" AFTER DELETE ON "BodyWeight"
  FOR EACH ROW EXECUTE FUNCTION sync_tombstone();

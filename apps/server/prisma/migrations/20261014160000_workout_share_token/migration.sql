-- Ссылка «Поделиться» на результат тренировки.

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Workout_shareToken_key" ON "Workout"("shareToken");

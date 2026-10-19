-- Разминка по умолчанию 10 минут — и у существующих пользователей: экран пропускается одной кнопкой
ALTER TABLE "SportProfile" ADD COLUMN "warmupMinutes" INTEGER NOT NULL DEFAULT 10;

ALTER TABLE "Complex" ADD COLUMN "warmupMinutes" INTEGER;

-- Без default: у старых тренировок разминки не было
ALTER TABLE "Workout" ADD COLUMN "warmupMinutes" INTEGER,
ADD COLUMN "warmupFinishedAt" TIMESTAMP(3);

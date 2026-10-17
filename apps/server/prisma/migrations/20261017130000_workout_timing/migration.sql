-- Без default: у старых подходов и тренировок времени нет, а не время миграции
ALTER TABLE "Workout" ADD COLUMN "cooldownStartedAt" TIMESTAMP(3),
ADD COLUMN "cooldownFinishedAt" TIMESTAMP(3);

ALTER TABLE "WorkoutSet" ADD COLUMN "doneAt" TIMESTAMP(3),
ADD COLUMN "workSeconds" INTEGER,
ADD COLUMN "restTargetSeconds" INTEGER;

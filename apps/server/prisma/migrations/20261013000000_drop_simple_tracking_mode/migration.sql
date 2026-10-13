-- Простой режим учёта убран: тренировка всегда ведётся по упражнениям.

-- Начатые «планы на день» простого режима продолжаются как обычные тренировки
UPDATE "Workout" SET "mode" = 'DETAILED' WHERE "mode" = 'SIMPLE' AND "status" = 'IN_PROGRESS';

-- Шага «Режим учёта» в первом запуске больше нет
UPDATE "SportProfile" SET "onboardingStep" = 3 WHERE "onboardingStep" > 3;

-- AlterTable
ALTER TABLE "SportProfile" DROP COLUMN "trackingMode";

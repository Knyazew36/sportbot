-- Звук и вибрация конца таймера — отдельные настройки. Вибрация наследует прежний общий переключатель.

-- AlterTable
ALTER TABLE "SportProfile" ADD COLUMN "timerVibration" BOOLEAN NOT NULL DEFAULT true;

UPDATE "SportProfile" SET "timerVibration" = "timerSound";

-- Настройки тренировки в приложении: отдых между подходами, автостарт таймера, звук и вибрация.

-- AlterTable
ALTER TABLE "SportProfile" ADD COLUMN "restSeconds" INTEGER NOT NULL DEFAULT 90,
ADD COLUMN "restAutoStart" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "timerSound" BOOLEAN NOT NULL DEFAULT true;

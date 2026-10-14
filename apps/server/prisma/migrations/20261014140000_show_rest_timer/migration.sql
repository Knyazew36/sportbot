-- Показывать ли таймер отдыха на экране тренировки (настройка профиля).

-- AlterTable
ALTER TABLE "SportProfile" ADD COLUMN "showRestTimer" BOOLEAN NOT NULL DEFAULT true;

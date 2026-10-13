-- Кардио в комплексе программы и его снимок в тренировке.

-- AlterTable
ALTER TABLE "Complex" ADD COLUMN "cardioName" TEXT,
ADD COLUMN "cardioMinutes" INTEGER;

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN "cardioName" TEXT,
ADD COLUMN "cardioMinutes" INTEGER;

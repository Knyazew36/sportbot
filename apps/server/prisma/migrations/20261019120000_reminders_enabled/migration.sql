-- Повторы вопросов становятся выключаемыми; прежним пользователям оставляем как было
ALTER TABLE "SportProfile" ADD COLUMN "remindersEnabled" BOOLEAN NOT NULL DEFAULT true;

-- Утренний и вечерний вопросы становятся выключаемыми; прежним пользователям оставляем как было
ALTER TABLE "SportProfile" ADD COLUMN "questionsEnabled" BOOLEAN NOT NULL DEFAULT true;

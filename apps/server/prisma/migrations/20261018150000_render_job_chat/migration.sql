-- «В чат» — пометка на задаче-файле, а не отдельный способ доставки: файл не рендерится заново
ALTER TABLE "RenderJob" ADD COLUMN "chatRequestedAt" TIMESTAMP(3),
ADD COLUMN "chatError" TEXT;

UPDATE "RenderJob" SET "chatRequestedAt" = "createdAt" WHERE "delivery" = 'CHAT';
-- Прежний текст ошибки доставки лежал в error — переносим, error остаётся только для рендера
UPDATE "RenderJob" SET "chatError" = "error", "error" = NULL WHERE "delivery" = 'CHAT' AND "status" = 'DONE' AND "error" IS NOT NULL;

ALTER TABLE "RenderJob" DROP COLUMN "delivery";

DROP TYPE "RenderDelivery";

-- ProRes заменён лёгким PNG-в-MOV: формат переименован prores-alpha → mov-alpha
UPDATE "RenderJob" SET "format" = 'mov-alpha' WHERE "format" = 'prores-alpha';

-- Ссылка «Поделиться» программой: токен вместо id, чтобы чужие программы не открывали перебором
ALTER TABLE "Program" ADD COLUMN "shareToken" TEXT;

CREATE UNIQUE INDEX "Program_shareToken_key" ON "Program"("shareToken");

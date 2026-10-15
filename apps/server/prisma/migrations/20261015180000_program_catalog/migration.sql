-- AlterTable
ALTER TABLE "Program" ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "sourceDismissedAt" TIMESTAMP(3);

-- Шаблоны, которые уже были в «Взять», остаются видимыми; порядок — прежний (по id)
UPDATE "Program" p SET "isPublished" = true, "position" = o.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "id") AS rn FROM "Program" WHERE "isTemplate" = true) o
WHERE p."id" = o."id";

-- CreateTable
CREATE TABLE "ProgramTagGroup" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ProgramTagGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramTagGroup_code_key" ON "ProgramTagGroup"("code");

-- CreateIndex
CREATE INDEX "ProgramTagGroup_position_idx" ON "ProgramTagGroup"("position");

-- Прежние плоские теги попадают в «Прочее», дальше их разносят по группам в админке
INSERT INTO "ProgramTagGroup" ("code", "name", "position") VALUES ('other', 'Прочее', 1);

-- AlterTable
ALTER TABLE "ProgramTag" ADD COLUMN "groupId" INTEGER;
UPDATE "ProgramTag" SET "groupId" = (SELECT "id" FROM "ProgramTagGroup" WHERE "code" = 'other');
ALTER TABLE "ProgramTag" ALTER COLUMN "groupId" SET NOT NULL;

-- DropIndex
DROP INDEX "ProgramTag_position_idx";

-- CreateIndex
CREATE INDEX "ProgramTag_groupId_position_idx" ON "ProgramTag"("groupId", "position");

-- CreateIndex
CREATE INDEX "Program_isTemplate_isPublished_position_idx" ON "Program"("isTemplate", "isPublished", "position");

-- AddForeignKey
ALTER TABLE "ProgramTag" ADD CONSTRAINT "ProgramTag_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ProgramTagGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

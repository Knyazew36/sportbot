-- Время правки по полям: офлайн-правка с телефона применяется только к полям, которые позже не правили
ALTER TABLE "SportProfile" ADD COLUMN "fieldUpdatedAt" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "Program" ADD COLUMN "fieldUpdatedAt" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "Complex" ADD COLUMN "fieldUpdatedAt" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "ComplexExercise" ADD COLUMN "fieldUpdatedAt" JSONB NOT NULL DEFAULT '{}';

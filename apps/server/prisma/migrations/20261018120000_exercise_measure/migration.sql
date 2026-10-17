-- CreateEnum
CREATE TYPE "ExerciseMeasure" AS ENUM ('REPS', 'TIME');

ALTER TABLE "Exercise" ADD COLUMN "measure" "ExerciseMeasure" NOT NULL DEFAULT 'REPS';

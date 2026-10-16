-- AlterTable
ALTER TABLE "WorkoutSet" ADD COLUMN "clientId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSet_clientId_key" ON "WorkoutSet"("clientId");

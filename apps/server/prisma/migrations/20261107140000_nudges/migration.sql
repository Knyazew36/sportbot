-- AlterTable
ALTER TABLE "SportProfile" ADD COLUMN     "comebackSentOn" DATE,
ADD COLUMN     "ignoredInRow" INTEGER NOT NULL DEFAULT 0;

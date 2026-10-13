-- CreateEnum
CREATE TYPE "BotChannel" AS ENUM ('TELEGRAM', 'MAX');

-- CreateEnum
CREATE TYPE "TrackingMode" AS ENUM ('SIMPLE', 'DETAILED');

-- CreateEnum
CREATE TYPE "WeightAskFrequency" AS ENUM ('OFF', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PauseOrigin" AS ENUM ('MANUAL', 'SUGGESTED');

-- CreateEnum
CREATE TYPE "Equipment" AS ENUM ('BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT');

-- CreateEnum
CREATE TYPE "CatalogStatus" AS ENUM ('CATALOG', 'DRAFT');

-- CreateEnum
CREATE TYPE "MuscleRole" AS ENUM ('PRIMARY', 'SECONDARY');

-- CreateEnum
CREATE TYPE "StretchKind" AS ENUM ('COOLDOWN', 'WARMUP');

-- CreateEnum
CREATE TYPE "ModerationOutcome" AS ENUM ('PENDING', 'APPROVED', 'APPROVED_EDITED', 'DUPLICATE', 'REJECTED');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PlanDayType" AS ENUM ('PLANNED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "PlanDayStatus" AS ENUM ('PENDING', 'DONE', 'MISSED', 'PAUSED');

-- CreateEnum
CREATE TYPE "PollAnswer" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "WorkoutStatus" AS ENUM ('IN_PROGRESS', 'FINISHED', 'AUTO_CLOSED');

-- CreateEnum
CREATE TYPE "CooldownBlock" AS ENUM ('MAIN', 'OPTIONAL');

-- CreateTable
CREATE TABLE "SportProfile" (
    "userId" INTEGER NOT NULL,
    "displayName" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'Europe/Moscow',
    "trainingDays" INTEGER[],
    "morningTime" TEXT NOT NULL DEFAULT '08:00',
    "eveningTime" TEXT NOT NULL DEFAULT '20:00',
    "trackingMode" "TrackingMode" NOT NULL DEFAULT 'SIMPLE',
    "weightAskFrequency" "WeightAskFrequency" NOT NULL DEFAULT 'OFF',
    "weightAskedOn" DATE,
    "activeProgramId" INTEGER,
    "nextComplexId" INTEGER,
    "onboardingStep" INTEGER NOT NULL DEFAULT 1,
    "onboardedAt" TIMESTAMP(3),
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "missedInRow" INTEGER NOT NULL DEFAULT 0,
    "jointDisclaimerShownAt" TIMESTAMP(3),
    "weeklySummarySentOn" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SportProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Pause" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "origin" "PauseOrigin" NOT NULL DEFAULT 'MANUAL',
    "endedAt" TIMESTAMP(3),
    "endAskedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Limitation" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "jointId" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Limitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyWeight" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "value" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedAccount" (
    "id" SERIAL NOT NULL,
    "channel" "BotChannel" NOT NULL,
    "externalId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotSession" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "channel" "BotChannel" NOT NULL,
    "state" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Muscle" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bodyOrder" INTEGER NOT NULL,

    CONSTRAINT "Muscle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Joint" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Joint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "nameNormalized" TEXT NOT NULL,
    "technique" TEXT,
    "imagePath" TEXT,
    "imageTelegramFileId" TEXT,
    "imageMaxToken" TEXT,
    "videoUrl" TEXT,
    "equipment" "Equipment",
    "status" "CatalogStatus" NOT NULL DEFAULT 'CATALOG',
    "authorId" INTEGER,
    "originDraftId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseMuscle" (
    "exerciseId" INTEGER NOT NULL,
    "muscleId" INTEGER NOT NULL,
    "role" "MuscleRole" NOT NULL,

    CONSTRAINT "ExerciseMuscle_pkey" PRIMARY KEY ("exerciseId","muscleId")
);

-- CreateTable
CREATE TABLE "ExerciseJoint" (
    "exerciseId" INTEGER NOT NULL,
    "jointId" INTEGER NOT NULL,

    CONSTRAINT "ExerciseJoint_pkey" PRIMARY KEY ("exerciseId","jointId")
);

-- CreateTable
CREATE TABLE "Stretch" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "nameNormalized" TEXT NOT NULL,
    "howTo" TEXT,
    "imagePath" TEXT,
    "imageTelegramFileId" TEXT,
    "imageMaxToken" TEXT,
    "holdSeconds" INTEGER NOT NULL,
    "perSide" BOOLEAN NOT NULL DEFAULT false,
    "kind" "StretchKind" NOT NULL DEFAULT 'COOLDOWN',
    "status" "CatalogStatus" NOT NULL DEFAULT 'CATALOG',
    "authorId" INTEGER,
    "originDraftId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stretch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StretchMuscle" (
    "stretchId" INTEGER NOT NULL,
    "muscleId" INTEGER NOT NULL,

    CONSTRAINT "StretchMuscle_pkey" PRIMARY KEY ("stretchId","muscleId")
);

-- CreateTable
CREATE TABLE "ModerationRequest" (
    "id" SERIAL NOT NULL,
    "exerciseId" INTEGER,
    "stretchId" INTEGER,
    "authorId" INTEGER,
    "outcome" "ModerationOutcome" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "duplicateOfExerciseId" INTEGER,
    "duplicateOfStretchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "ModerationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" SERIAL NOT NULL,
    "exerciseId" INTEGER,
    "stretchId" INTEGER,
    "userId" INTEGER,
    "text" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "code" TEXT,
    "ownerId" INTEGER,
    "sourceProgramId" INTEGER,
    "sourceSyncedAt" TIMESTAMP(3),
    "contentUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complex" (
    "id" SERIAL NOT NULL,
    "programId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "Complex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplexExercise" (
    "id" SERIAL NOT NULL,
    "complexId" INTEGER NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "repsMin" INTEGER NOT NULL,
    "repsMax" INTEGER NOT NULL,

    CONSTRAINT "ComplexExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanDay" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "type" "PlanDayType" NOT NULL DEFAULT 'PLANNED',
    "status" "PlanDayStatus" NOT NULL DEFAULT 'PENDING',
    "morningAnswer" "PollAnswer",
    "eveningAnswer" "PollAnswer",
    "morningAskedAt" TIMESTAMP(3),
    "morningRemindedAt" TIMESTAMP(3),
    "eveningAskedAt" TIMESTAMP(3),
    "eveningRemindedAt" TIMESTAMP(3),
    "suggestedComplexId" INTEGER,
    "workoutId" INTEGER,
    "rescheduleOfferedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "complexId" INTEGER,
    "complexName" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mode" "TrackingMode" NOT NULL,
    "status" "WorkoutStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "unplanned" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutExercise" (
    "id" SERIAL NOT NULL,
    "workoutId" INTEGER NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "plannedSets" INTEGER NOT NULL,
    "repsMin" INTEGER NOT NULL,
    "repsMax" INTEGER NOT NULL,
    "replacedExerciseId" INTEGER,

    CONSTRAINT "WorkoutExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSet" (
    "id" SERIAL NOT NULL,
    "workoutExerciseId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "weight" DECIMAL(6,2) NOT NULL,
    "reps" INTEGER NOT NULL,

    CONSTRAINT "WorkoutSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutStretch" (
    "id" SERIAL NOT NULL,
    "workoutId" INTEGER NOT NULL,
    "stretchId" INTEGER NOT NULL,
    "block" "CooldownBlock" NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "WorkoutStretch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendInvite" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" SERIAL NOT NULL,
    "userAId" INTEGER NOT NULL,
    "userBId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotGroup" (
    "id" SERIAL NOT NULL,
    "channel" "BotChannel" NOT NULL,
    "chatId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotGroupMember" (
    "groupId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotGroupMember_pkey" PRIMARY KEY ("groupId","userId")
);

-- CreateIndex
CREATE INDEX "SportProfile_activeProgramId_idx" ON "SportProfile"("activeProgramId");

-- CreateIndex
CREATE INDEX "Pause_userId_endedAt_idx" ON "Pause"("userId", "endedAt");

-- CreateIndex
CREATE INDEX "Limitation_userId_cancelledAt_idx" ON "Limitation"("userId", "cancelledAt");

-- CreateIndex
CREATE UNIQUE INDEX "BodyWeight_userId_date_key" ON "BodyWeight"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedAccount_channel_externalId_key" ON "BlockedAccount"("channel", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "BotSession_userId_channel_key" ON "BotSession"("userId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "Muscle_code_key" ON "Muscle"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Joint_code_key" ON "Joint"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_code_key" ON "Exercise"("code");

-- CreateIndex
CREATE INDEX "Exercise_nameNormalized_idx" ON "Exercise"("nameNormalized");

-- CreateIndex
CREATE INDEX "Exercise_status_authorId_idx" ON "Exercise"("status", "authorId");

-- CreateIndex
CREATE INDEX "Exercise_originDraftId_idx" ON "Exercise"("originDraftId");

-- CreateIndex
CREATE INDEX "ExerciseMuscle_muscleId_role_idx" ON "ExerciseMuscle"("muscleId", "role");

-- CreateIndex
CREATE INDEX "ExerciseJoint_jointId_idx" ON "ExerciseJoint"("jointId");

-- CreateIndex
CREATE UNIQUE INDEX "Stretch_code_key" ON "Stretch"("code");

-- CreateIndex
CREATE INDEX "Stretch_nameNormalized_idx" ON "Stretch"("nameNormalized");

-- CreateIndex
CREATE INDEX "Stretch_status_kind_authorId_idx" ON "Stretch"("status", "kind", "authorId");

-- CreateIndex
CREATE INDEX "Stretch_originDraftId_idx" ON "Stretch"("originDraftId");

-- CreateIndex
CREATE INDEX "StretchMuscle_muscleId_idx" ON "StretchMuscle"("muscleId");

-- CreateIndex
CREATE INDEX "ModerationRequest_outcome_idx" ON "ModerationRequest"("outcome");

-- CreateIndex
CREATE INDEX "ModerationRequest_authorId_createdAt_idx" ON "ModerationRequest"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Program_code_key" ON "Program"("code");

-- CreateIndex
CREATE INDEX "Program_ownerId_idx" ON "Program"("ownerId");

-- CreateIndex
CREATE INDEX "Program_sourceProgramId_idx" ON "Program"("sourceProgramId");

-- CreateIndex
CREATE INDEX "Complex_programId_position_idx" ON "Complex"("programId", "position");

-- CreateIndex
CREATE INDEX "ComplexExercise_complexId_position_idx" ON "ComplexExercise"("complexId", "position");

-- CreateIndex
CREATE INDEX "ComplexExercise_exerciseId_idx" ON "ComplexExercise"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanDay_workoutId_key" ON "PlanDay"("workoutId");

-- CreateIndex
CREATE INDEX "PlanDay_status_date_idx" ON "PlanDay"("status", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PlanDay_userId_date_key" ON "PlanDay"("userId", "date");

-- CreateIndex
CREATE INDEX "Workout_userId_date_idx" ON "Workout"("userId", "date");

-- CreateIndex
CREATE INDEX "Workout_userId_status_idx" ON "Workout"("userId", "status");

-- CreateIndex
CREATE INDEX "WorkoutExercise_workoutId_position_idx" ON "WorkoutExercise"("workoutId", "position");

-- CreateIndex
CREATE INDEX "WorkoutExercise_exerciseId_idx" ON "WorkoutExercise"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSet_workoutExerciseId_number_key" ON "WorkoutSet"("workoutExerciseId", "number");

-- CreateIndex
CREATE INDEX "WorkoutStretch_workoutId_position_idx" ON "WorkoutStretch"("workoutId", "position");

-- CreateIndex
CREATE INDEX "WorkoutStretch_stretchId_idx" ON "WorkoutStretch"("stretchId");

-- CreateIndex
CREATE UNIQUE INDEX "FriendInvite_code_key" ON "FriendInvite"("code");

-- CreateIndex
CREATE INDEX "FriendInvite_senderId_idx" ON "FriendInvite"("senderId");

-- CreateIndex
CREATE INDEX "Friendship_userBId_idx" ON "Friendship"("userBId");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_userAId_userBId_key" ON "Friendship"("userAId", "userBId");

-- CreateIndex
CREATE UNIQUE INDEX "BotGroup_channel_chatId_key" ON "BotGroup"("channel", "chatId");

-- CreateIndex
CREATE INDEX "BotGroupMember_userId_idx" ON "BotGroupMember"("userId");

-- AddForeignKey
ALTER TABLE "SportProfile" ADD CONSTRAINT "SportProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SportProfile" ADD CONSTRAINT "SportProfile_activeProgramId_fkey" FOREIGN KEY ("activeProgramId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SportProfile" ADD CONSTRAINT "SportProfile_nextComplexId_fkey" FOREIGN KEY ("nextComplexId") REFERENCES "Complex"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pause" ADD CONSTRAINT "Pause_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Limitation" ADD CONSTRAINT "Limitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Limitation" ADD CONSTRAINT "Limitation_jointId_fkey" FOREIGN KEY ("jointId") REFERENCES "Joint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyWeight" ADD CONSTRAINT "BodyWeight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotSession" ADD CONSTRAINT "BotSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_originDraftId_fkey" FOREIGN KEY ("originDraftId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseMuscle" ADD CONSTRAINT "ExerciseMuscle_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseMuscle" ADD CONSTRAINT "ExerciseMuscle_muscleId_fkey" FOREIGN KEY ("muscleId") REFERENCES "Muscle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseJoint" ADD CONSTRAINT "ExerciseJoint_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseJoint" ADD CONSTRAINT "ExerciseJoint_jointId_fkey" FOREIGN KEY ("jointId") REFERENCES "Joint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stretch" ADD CONSTRAINT "Stretch_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stretch" ADD CONSTRAINT "Stretch_originDraftId_fkey" FOREIGN KEY ("originDraftId") REFERENCES "Stretch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StretchMuscle" ADD CONSTRAINT "StretchMuscle_stretchId_fkey" FOREIGN KEY ("stretchId") REFERENCES "Stretch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StretchMuscle" ADD CONSTRAINT "StretchMuscle_muscleId_fkey" FOREIGN KEY ("muscleId") REFERENCES "Muscle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationRequest" ADD CONSTRAINT "ModerationRequest_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationRequest" ADD CONSTRAINT "ModerationRequest_stretchId_fkey" FOREIGN KEY ("stretchId") REFERENCES "Stretch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationRequest" ADD CONSTRAINT "ModerationRequest_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationRequest" ADD CONSTRAINT "ModerationRequest_duplicateOfExerciseId_fkey" FOREIGN KEY ("duplicateOfExerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationRequest" ADD CONSTRAINT "ModerationRequest_duplicateOfStretchId_fkey" FOREIGN KEY ("duplicateOfStretchId") REFERENCES "Stretch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_stretchId_fkey" FOREIGN KEY ("stretchId") REFERENCES "Stretch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_sourceProgramId_fkey" FOREIGN KEY ("sourceProgramId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complex" ADD CONSTRAINT "Complex_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplexExercise" ADD CONSTRAINT "ComplexExercise_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplexExercise" ADD CONSTRAINT "ComplexExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDay" ADD CONSTRAINT "PlanDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDay" ADD CONSTRAINT "PlanDay_suggestedComplexId_fkey" FOREIGN KEY ("suggestedComplexId") REFERENCES "Complex"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDay" ADD CONSTRAINT "PlanDay_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "Complex"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_replacedExerciseId_fkey" FOREIGN KEY ("replacedExerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSet" ADD CONSTRAINT "WorkoutSet_workoutExerciseId_fkey" FOREIGN KEY ("workoutExerciseId") REFERENCES "WorkoutExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutStretch" ADD CONSTRAINT "WorkoutStretch_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutStretch" ADD CONSTRAINT "WorkoutStretch_stretchId_fkey" FOREIGN KEY ("stretchId") REFERENCES "Stretch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendInvite" ADD CONSTRAINT "FriendInvite_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotGroupMember" ADD CONSTRAINT "BotGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "BotGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotGroupMember" ADD CONSTRAINT "BotGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


CREATE TABLE `body_weights` (
	`clientId` text PRIMARY KEY NOT NULL,
	`id` integer,
	`date` text NOT NULL,
	`value` real NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `body_weights_date` ON `body_weights` (`date`);--> statement-breakpoint
CREATE TABLE `complex_exercises` (
	`clientId` text PRIMARY KEY NOT NULL,
	`id` integer,
	`complexClientId` text NOT NULL,
	`exerciseId` integer NOT NULL,
	`position` integer NOT NULL,
	`sets` integer NOT NULL,
	`repsMin` integer NOT NULL,
	`repsMax` integer NOT NULL,
	`superset` integer,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `complex_exercises_complex` ON `complex_exercises` (`complexClientId`);--> statement-breakpoint
CREATE TABLE `complexes` (
	`clientId` text PRIMARY KEY NOT NULL,
	`id` integer,
	`programClientId` text NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	`cardioName` text,
	`cardioMinutes` integer,
	`warmupMinutes` integer,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `complexes_program` ON `complexes` (`programClientId`);--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`nameNormalized` text NOT NULL,
	`technique` text,
	`steps` text NOT NULL,
	`mistakes` text NOT NULL,
	`imageUrl` text,
	`imageEndUrl` text,
	`imageCredit` text,
	`videoUrl` text,
	`equipment` text,
	`measure` text NOT NULL,
	`draft` integer NOT NULL,
	`muscles` text NOT NULL,
	`jointIds` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `joints` (
	`id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `limitations` (
	`clientId` text PRIMARY KEY NOT NULL,
	`id` integer,
	`jointId` integer NOT NULL,
	`startDate` text NOT NULL,
	`endDate` text,
	`cancelledAt` text,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `muscles` (
	`id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`bodyOrder` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `outbox` (
	`opId` text PRIMARY KEY NOT NULL,
	`seq` integer NOT NULL,
	`type` text NOT NULL,
	`entity` text NOT NULL,
	`clientId` text NOT NULL,
	`payload` text NOT NULL,
	`at` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `outbox_seq` ON `outbox` (`seq`);--> statement-breakpoint
CREATE INDEX `outbox_client` ON `outbox` (`clientId`);--> statement-breakpoint
CREATE TABLE `pauses` (
	`clientId` text PRIMARY KEY NOT NULL,
	`id` integer,
	`startDate` text NOT NULL,
	`endDate` text,
	`origin` text NOT NULL,
	`endedAt` text,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plan_days` (
	`clientId` text PRIMARY KEY NOT NULL,
	`id` integer,
	`date` text NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`morningAnswer` text,
	`eveningAnswer` text,
	`suggestedComplexClientId` text,
	`workoutClientId` text,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `plan_days_date` ON `plan_days` (`date`);--> statement-breakpoint
CREATE TABLE `profile` (
	`id` integer PRIMARY KEY NOT NULL,
	`displayName` text NOT NULL,
	`timeZone` text NOT NULL,
	`gender` text,
	`trainingDays` text NOT NULL,
	`morningTime` text NOT NULL,
	`eveningTime` text NOT NULL,
	`remindersEnabled` integer NOT NULL,
	`questionsEnabled` integer NOT NULL,
	`weightAskFrequency` text NOT NULL,
	`activeProgramId` integer,
	`activeProgramClientId` text,
	`nextComplexId` integer,
	`nextComplexClientId` text,
	`onboardingStep` integer NOT NULL,
	`onboardedAt` text,
	`currentStreak` integer NOT NULL,
	`bestStreak` integer NOT NULL,
	`missedInRow` integer NOT NULL,
	`showRestTimer` integer NOT NULL,
	`restSeconds` integer NOT NULL,
	`restAutoStart` integer NOT NULL,
	`timerSound` integer NOT NULL,
	`timerVibration` integer NOT NULL,
	`warmupMinutes` integer NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`clientId` text PRIMARY KEY NOT NULL,
	`id` integer,
	`name` text NOT NULL,
	`sourceProgramId` integer,
	`sourceSyncedAt` text,
	`sourceDismissedAt` text,
	`contentUpdatedAt` text NOT NULL,
	`publication` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stretch_exclusions` (
	`clientId` text PRIMARY KEY NOT NULL,
	`stretchId` integer NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stretches` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`nameNormalized` text NOT NULL,
	`howTo` text,
	`steps` text NOT NULL,
	`mistakes` text NOT NULL,
	`imageUrl` text,
	`imageEndUrl` text,
	`imageCredit` text,
	`videoUrl` text,
	`feel` text,
	`position` text,
	`holdSeconds` integer NOT NULL,
	`perSide` integer NOT NULL,
	`kind` text NOT NULL,
	`draft` integer NOT NULL,
	`muscleIds` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tag_groups` (
	`id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	`groupId` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workout_exercises` (
	`clientId` text PRIMARY KEY NOT NULL,
	`id` integer,
	`workoutClientId` text NOT NULL,
	`exerciseId` integer NOT NULL,
	`position` integer NOT NULL,
	`done` integer NOT NULL,
	`plannedSets` integer NOT NULL,
	`repsMin` integer NOT NULL,
	`repsMax` integer NOT NULL,
	`superset` integer,
	`replacedExerciseId` integer,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `workout_exercises_workout` ON `workout_exercises` (`workoutClientId`);--> statement-breakpoint
CREATE TABLE `workout_sets` (
	`clientId` text PRIMARY KEY NOT NULL,
	`id` integer,
	`workoutExerciseClientId` text NOT NULL,
	`number` integer NOT NULL,
	`weight` real NOT NULL,
	`reps` integer NOT NULL,
	`doneAt` text,
	`workSeconds` integer,
	`restTargetSeconds` integer,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `workout_sets_item` ON `workout_sets` (`workoutExerciseClientId`);--> statement-breakpoint
CREATE TABLE `workout_stretches` (
	`clientId` text PRIMARY KEY NOT NULL,
	`id` integer,
	`workoutClientId` text NOT NULL,
	`stretchId` integer NOT NULL,
	`block` text NOT NULL,
	`position` integer NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `workout_stretches_workout` ON `workout_stretches` (`workoutClientId`);--> statement-breakpoint
CREATE TABLE `workouts` (
	`clientId` text PRIMARY KEY NOT NULL,
	`id` integer,
	`complexClientId` text,
	`complexName` text NOT NULL,
	`cardioName` text,
	`cardioMinutes` integer,
	`date` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`unplanned` integer NOT NULL,
	`startedAt` text NOT NULL,
	`finishedAt` text,
	`warmupMinutes` integer,
	`warmupFinishedAt` text,
	`cooldownStartedAt` text,
	`cooldownFinishedAt` text,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `workouts_date` ON `workouts` (`date`);
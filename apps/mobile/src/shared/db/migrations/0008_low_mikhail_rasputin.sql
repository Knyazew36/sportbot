CREATE TABLE `stretch_routines` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`position` integer NOT NULL,
	`stretchIds` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stretch_sessions` (
	`clientId` text PRIMARY KEY NOT NULL,
	`id` integer,
	`routineId` integer,
	`routineName` text NOT NULL,
	`date` text NOT NULL,
	`startedAt` text NOT NULL,
	`finishedAt` text,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `stretch_sessions_startedAt` ON `stretch_sessions` (`startedAt`);
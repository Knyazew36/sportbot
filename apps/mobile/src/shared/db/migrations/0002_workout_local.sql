ALTER TABLE `outbox` ADD `touched` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `workout_exercises` ADD `localId` integer;--> statement-breakpoint
ALTER TABLE `workout_sets` ADD `localId` integer;--> statement-breakpoint
ALTER TABLE `workout_stretches` ADD `localId` integer;--> statement-breakpoint
ALTER TABLE `workouts` ADD `localId` integer;
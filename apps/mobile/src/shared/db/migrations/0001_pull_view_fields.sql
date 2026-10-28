ALTER TABLE `plan_days` ADD `rescheduleOfferedAt` text;--> statement-breakpoint
ALTER TABLE `plan_days` ADD `eveningAskedAt` text;--> statement-breakpoint
ALTER TABLE `profile` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `profile` ADD `timeZoneTitle` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `programs` ADD `description` text;--> statement-breakpoint
ALTER TABLE `programs` ADD `fromFriend` text;--> statement-breakpoint
ALTER TABLE `programs` ADD `fromTemplate` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `programs` ADD `sourceUpdated` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `programs` ADD `isPublished` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `programs` ADD `addedCount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `programs` ADD `textPending` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `programs` ADD `rejectReason` text;--> statement-breakpoint
ALTER TABLE `programs` ADD `tags` text DEFAULT '[]' NOT NULL;
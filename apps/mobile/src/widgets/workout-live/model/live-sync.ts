import type { WorkoutLiveProps } from './types';

/** Экран блокировки есть только у iOS (live-sync.ios.ts) и Android (live-sync.android.ts) */
export const syncWorkoutLive = async (_props: WorkoutLiveProps | null): Promise<void> => {};

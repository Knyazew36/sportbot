/** Длительности разминки, мин: 0 — без разминки. Других значений интерфейс не предлагает. */
export const WARMUP_MINUTES = [0, 5, 10, 15] as const;

/** Разминка тренировки: своя у комплекса, иначе из профиля. null — без разминки. */
export const resolveWarmup = (
  complex: { warmupMinutes: number | null },
  profile: { warmupMinutes: number },
): number | null => (complex.warmupMinutes ?? profile.warmupMinutes) || null;

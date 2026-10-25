import type { Program } from '@sportbot/api/entities/program';

/** Сначала то, что чаще берут; при равенстве — порядок каталога (sort стабильный) */
export const byPopularity = (list: Program[]): Program[] => [...list].sort((a, b) => b.addedCount - a.addedCount);

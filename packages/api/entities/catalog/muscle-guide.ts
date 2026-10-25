import { MUSCLE_GROUPS } from './types'

/** Группа, в которую входит мышца */
export const muscleGroupOf = (code: string) => MUSCLE_GROUPS.find(g => g.codes.includes(code))

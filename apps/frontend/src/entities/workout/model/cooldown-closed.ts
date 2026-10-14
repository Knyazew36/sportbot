import { local } from '@/shared/lib/storage'

// Заминка ничего не пишет на сервер, поэтому «уже пропустил или прошёл» помним на устройстве.
// Хватает последней тренировки: главная предлагает заминку только к сегодняшней
const KEY = 'cooldown-closed'

/** Заминку тренировки пропустили или прошли — главная её больше не предлагает */
export const closeCooldown = (workoutId: number) => local.set(KEY, String(workoutId))

export const isCooldownClosed = (workoutId: number) => local.get(KEY) === String(workoutId)

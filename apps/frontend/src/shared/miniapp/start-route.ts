import { buildPath, ROUTES } from '@/shared/config/paths'

// Пара к APP_SCREEN на бэке (apps/server/src/bot/bot.types.ts): кнопка «Открыть в приложении» кладёт экран
// в startapp, здесь он превращается в маршрут. Меняются только вместе
const BY_ID: Record<string, (id: number) => string> = {
  cd: workoutId => buildPath(ROUTES.COOLDOWN, { workoutId }),
  fr: friendId => buildPath(ROUTES.FRIEND, { friendId }),
  pr: programId => buildPath(ROUTES.PROGRAM, { programId }),
  md: requestId => buildPath(ROUTES.ADMIN_REQUEST, { requestId }),
  // Отдельной карточки жалобы нет — список открытых жалоб
  cp: () => `${ROUTES.ADMIN}?tab=complaints`,
}

const PLAIN: Record<string, string> = {
  today: ROUTES.TODAY,
  mine: `${ROUTES.LIBRARY}?tab=mine`,
}

/** Маршрут по параметру запуска; неизвестный параметр — null, приложение откроется как обычно */
export const startRoute = (param: string | null): string | null => {
  if (!param) return null
  if (PLAIN[param]) return PLAIN[param]
  const match = /^([a-z]+)_(\d+)$/.exec(param)
  const build = match && BY_ID[match[1]!]
  return build ? build(Number(match[2])) : null
}

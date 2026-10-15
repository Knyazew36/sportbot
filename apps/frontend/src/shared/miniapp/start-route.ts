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

// Ссылки «Поделиться» результатом: в startapp не id, а токен — чужие тренировки перебором не открыть
const BY_TOKEN: Record<string, (token: string) => string> = {
  ws: token => buildPath(ROUTES.WORKOUT_RESULT, { token }),
}

const PLAIN: Record<string, string> = {
  today: ROUTES.TODAY,
  stats: ROUTES.STATS,
  tpl: ROUTES.PROGRAM_TEMPLATES,
  mine: `${ROUTES.LIBRARY}?tab=mine`,
}

/** Маршрут по параметру запуска; неизвестный параметр — null, приложение откроется как обычно */
export const startRoute = (param: string | null): string | null => {
  if (!param) return null
  if (PLAIN[param]) return PLAIN[param]
  const match = /^([a-z]+)_(\d+)$/.exec(param)
  const build = match && BY_ID[match[1]!]
  if (build) return build(Number(match[2]))
  const token = /^([a-z]+)_([a-f0-9]+)$/.exec(param)
  const byToken = token && BY_TOKEN[token[1]!]
  return byToken ? byToken(token[2]!) : null
}

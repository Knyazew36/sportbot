import { buildPath, ROUTES } from '@/shared/config/paths'

// Своё упражнение можно создать прямо из замены: мастер справочника возвращает на экран замены,
// а созданное (или выбранное похожее) приезжает в state и сразу открывает выбор «сегодня / в комплексе»

/** Что мастер справочника передаёт обратно на экран замены */
export type ReplaceLocationState = { created?: { id: number; name: string } }

export const replacePath = (itemId: number) => buildPath(ROUTES.WORKOUT_REPLACE, { itemId })

/** Мастер своего упражнения, открытый из замены пункта тренировки */
export const newEntryForReplacePath = (itemId: number) => `${ROUTES.LIBRARY_NEW}?kind=exercise&replace=${itemId}`

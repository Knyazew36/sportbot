/** Склейка классов без зависимостей: пакет не тянет clsx в чужие проекты. */
export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

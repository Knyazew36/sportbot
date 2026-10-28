// Мост между API-слоем и React: request.ts и access-token.ts не знают про компоненты,
// а гварды и кеш запросов подписываются сюда и реагируют на смену токена

/**
 * Почему сменилась сессия. expired — сервер отверг токен (протух, отозван): офлайн-очередь
 * не выбрасываем, она дождётся входа. logout — человек вышел сам: кеш прошлого аккаунта чистим.
 * refresh — тот же пользователь получил новый токен вместо старого: ни входа, ни выхода
 */
export type SessionChangeReason = 'login' | 'logout' | 'expired' | 'refresh'

type Listener = (reason: SessionChangeReason) => void

const listeners = new Set<Listener>()

export const subscribeSession = (listener: Listener): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const emitSessionChange = (reason: SessionChangeReason = 'login'): void => {
  listeners.forEach(listener => listener(reason))
}

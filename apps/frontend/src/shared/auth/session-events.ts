// Мост между API-слоем и React: request.ts и access-token.ts не знают про компоненты,
// а гварды и кеш запросов подписываются сюда и реагируют на смену токена
type Listener = () => void

const listeners = new Set<Listener>()

export const subscribeSession = (listener: Listener): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const emitSessionChange = (): void => {
  listeners.forEach(listener => listener())
}

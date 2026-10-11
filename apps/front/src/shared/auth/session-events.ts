// Мост между API-слоем и React: request.ts и access-token.ts не знают про компоненты,
// а гварды подписываются сюда и перерисовываются при смене токена
type Listener = () => void

const listeners = new Set<Listener>()

export const subscribeSession = (listener: Listener): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const emitSessionChange = (): void => {
  listeners.forEach((listener) => listener())
}

// Токен к этому моменту уже очищен в request.ts — гварды получат событие и уведут на логин
export const emitUnauthorized = emitSessionChange

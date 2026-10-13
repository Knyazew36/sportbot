// Обёртка над Web Storage: в webview/приватном режиме доступ может кидать исключение
const safeStorage = (getStorage: () => Storage) => ({
  get: (key: string): string | null => {
    try {
      return getStorage().getItem(key)
    } catch {
      return null
    }
  },
  set: (key: string, value: string): void => {
    try {
      getStorage().setItem(key, value)
    } catch {
      // хранилище недоступно — значение живёт до перезагрузки страницы
    }
  },
  remove: (key: string): void => {
    try {
      getStorage().removeItem(key)
    } catch {
      // нечего удалять
    }
  },
})

export const local = safeStorage(() => localStorage)
export const session = safeStorage(() => sessionStorage)

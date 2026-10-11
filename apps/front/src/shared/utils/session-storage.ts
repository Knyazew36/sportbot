// Обёртки над sessionStorage: в webview/приватном режиме доступ может кидать исключение
export const getFromSessionStorage = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

export const saveToSessionStorage = (key: string, value: string): void => {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

export const removeFromSessionStorage = (key: string): void => {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}

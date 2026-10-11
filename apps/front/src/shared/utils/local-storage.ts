// Обёртки над localStorage: в webview/приватном режиме доступ может кидать исключение
export const getFromLocalStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export const saveToLocalStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

export const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

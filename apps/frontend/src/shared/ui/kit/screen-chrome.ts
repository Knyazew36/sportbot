import { createContext, useContext } from 'react'

type ScreenChrome = {
  /** Видно ли нижнее меню: от этого зависит, куда прилипает главная кнопка */
  navVisible: boolean
  /** Поиск в фокусе: меню прячем, чтобы оно не висело над клавиатурой */
  setSearchFocused: (focused: boolean) => void
}

// Вне оболочки (превью, админка на десктопе) меню нет, сообщать некому
const ScreenChromeContext = createContext<ScreenChrome>({ navVisible: false, setSearchFocused: () => {} })

export const ScreenChromeProvider = ScreenChromeContext.Provider

export const useScreenChrome = () => useContext(ScreenChromeContext)

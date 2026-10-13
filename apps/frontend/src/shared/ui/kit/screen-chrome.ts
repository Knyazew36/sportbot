import { createContext, useContext } from 'react'

// Оболочка сообщает экранам, видно ли нижнее меню: от этого зависит, куда прилипает главная кнопка
const ScreenChromeContext = createContext({ navVisible: false })

export const ScreenChromeProvider = ScreenChromeContext.Provider

export const useScreenChrome = () => useContext(ScreenChromeContext)

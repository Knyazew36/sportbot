import { createContext, useContext, type ComponentRef, type RefObject } from 'react';
import type { View } from 'react-native';

/** Контент, который размывает стекло над ним: на Android BlurView видит только свой BlurTargetView */
export type BlurTarget = RefObject<ComponentRef<typeof View> | null>;

type ScreenChrome = {
  /** Высота нижнего меню поверх экрана: 0 — меню нет или оно спрятано под клавиатурой */
  navHeight: number;
  /** Контент открытого раздела — его размывает меню */
  navTarget: BlurTarget | null;
  /** Раздел на виду отдаёт меню свой контент; возвращает отписку. Вне табов меню нет — и функции нет */
  registerNavTarget?: (target: BlurTarget) => () => void;
};

// Порт screen-chrome фронта: экрану нужно знать про меню над ним, меню — про контент под ним
const ScreenChromeContext = createContext<ScreenChrome>({ navHeight: 0, navTarget: null });

export const ScreenChromeProvider = ScreenChromeContext.Provider;

export const useScreenChrome = () => useContext(ScreenChromeContext);

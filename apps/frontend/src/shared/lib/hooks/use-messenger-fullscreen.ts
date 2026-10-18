import { useSyncExternalStore } from 'react'

import { isMessengerFullscreen, onMessengerFullscreenChange } from '@/shared/miniapp'

/** Открыто ли приложение в мессенджере на весь экран. Следит за выходом из fullscreen и возвратом */
export const useMessengerFullscreen = (): boolean =>
  useSyncExternalStore(onMessengerFullscreenChange, isMessengerFullscreen, () => false)

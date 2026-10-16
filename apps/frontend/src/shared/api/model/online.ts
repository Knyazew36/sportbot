import { onlineManager } from '@tanstack/react-query'

import { useSyncExternalStore } from 'react'

const subscribe = (listener: () => void) => onlineManager.subscribe(listener)
const isOnline = () => onlineManager.isOnline()

/** Есть ли сеть — по мнению react-query: без неё запросы и очередь мутаций стоят на паузе */
export const useIsOnline = (): boolean => useSyncExternalStore(subscribe, isOnline)

import type { StateStore } from '@app/support-chat-client'

import { useSyncExternalStore } from 'react'

/** Состояние стора SDK в React. */
export const useStoreState = <T extends object>(store: StateStore<T>): T =>
  useSyncExternalStore(store.subscribe, store.getState, store.getState)

import { useEffect } from 'react';
import { AppState } from 'react-native';

import { onlineManager } from '@tanstack/react-query';

import { subscribeSession } from '@sportbot/api/client';

import type { LocalDb } from '@/shared/db/client';

import { flushPush, runSync } from './engine';
import { SYNC_INTERVAL_MS } from './constants';

/**
 * Когда синк запускается: открыли базу, вернулись в приложение, появилась сеть, вошли заново
 * и раз в пять минут, пока приложение на экране. В фоне не ходим — ОС всё равно усыпит таймер
 */
export const useSyncTriggers = (db: LocalDb | null) => {
  useEffect(() => {
    if (!db) return;
    const sync = () => void runSync(db);
    sync();

    let timer: ReturnType<typeof setInterval> | null = setInterval(sync, SYNC_INTERVAL_MS);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        sync();
        timer ??= setInterval(sync, SYNC_INTERVAL_MS);
      } else {
        flushPush();
        if (timer) clearInterval(timer);
        timer = null;
      }
    });
    const unsubscribeOnline = onlineManager.subscribe((online) => {
      if (online) sync();
    });
    const unsubscribeSession = subscribeSession((reason) => {
      if (reason === 'login') sync();
    });

    return () => {
      if (timer) clearInterval(timer);
      appState.remove();
      unsubscribeOnline();
      unsubscribeSession();
    };
  }, [db]);
};

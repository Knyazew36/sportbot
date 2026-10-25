import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { local } from '@/shared/lib/local';
import { storage } from '@/shared/lib/storage';

const readEndsAt = (raw: string | null) => {
  if (!raw) return null;
  try {
    const state = JSON.parse(raw) as { status: string; endsAt?: number };
    return state.status === 'running' && state.endsAt ? state.endsAt : null;
  } catch {
    return null;
  }
};

// Идёт ли отдых — по дедлайну в хранилище, без тиков раз в 250 мс: полосе нужен только факт.
// Подписка на MMKV, потому что полоса на табах смонтирована всё время, а отдых запускают на экране тренировки
export const useRestRunning = (key?: string) => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const listener = storage.addOnValueChangedListener((changed) => {
        if (changed === key) onChange();
      });
      return () => listener.remove();
    },
    [key],
  );
  const raw = useSyncExternalStore(subscribe, () => (key ? local.get(key) : null));
  const endsAt = readEndsAt(raw);
  const [now, setNow] = useState(() => Date.now());

  // Будильник ровно на конец отдыха: полоса сама перекрашивается обратно в мятную
  useEffect(() => {
    setNow(Date.now());
    if (!endsAt) return;
    const wait = endsAt - Date.now();
    if (wait <= 0) return;
    const id = setTimeout(() => setNow(Date.now()), wait + 50);
    return () => clearTimeout(id);
  }, [endsAt]);

  return endsAt !== null && endsAt > now;
};

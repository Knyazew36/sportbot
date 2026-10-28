import { useEffect, useRef, useState } from 'react';

import { toast } from 'sonner-native';

import type { LocalDb } from '@/shared/db';
import { haptic } from '@/shared/lib/haptics';
import { downloadCatalogMedia, type MediaProgress } from '@/shared/media/offline-media';

/** Скачивание картинок справочника: прогресс, отмена, итог тостом — экран можно и закрыть */
export const useOfflineMedia = (db: LocalDb) => {
  const [progress, setProgress] = useState<MediaProgress | null>(null);
  const cancelled = useRef(false);

  // Ушли с экрана — докачивать в фоне некому показывать, остановимся на текущей пачке
  useEffect(
    () => () => {
      cancelled.current = true;
    },
    [],
  );

  const start = async () => {
    cancelled.current = false;
    const ok = await downloadCatalogMedia(db, setProgress, () => cancelled.current);
    setProgress(null);
    if (cancelled.current) return;
    if (ok) {
      haptic.success();
      toast.success('Картинки справочника скачаны');
    } else {
      haptic.error();
      toast.error('Скачались не все картинки — проверьте сеть и повторите');
    }
  };

  const cancel = () => {
    cancelled.current = true;
    setProgress(null);
  };

  return { progress, start: () => void start(), cancel };
};

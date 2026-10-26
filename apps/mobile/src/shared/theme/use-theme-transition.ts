import { useCallback, useRef, useState } from 'react';
import { Platform, type View } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';
import { scheduleOnRN } from 'react-native-worklets';

const FADE_MS = 320;

/**
 * Плавная смена темы: Uniwind подменяет CSS-переменные мгновенно, поэтому цвета не анимируются.
 * Перед сменой снимаем экран, кладём снимок поверх, меняем тему под ним и растворяем снимок
 */
export const useThemeTransition = () => {
  const rootRef = useRef<View>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  // Смена темы ждёт, пока снимок отрисуется поверх, иначе мелькнёт новая тема без перехода
  const pendingApply = useRef<(() => void) | null>(null);
  const busy = useRef(false);
  const opacity = useSharedValue(0);

  const finish = useCallback(() => {
    setSnapshot(null);
    busy.current = false;
  }, []);

  const applyPending = () => {
    pendingApply.current?.();
    pendingApply.current = null;
  };

  const transition = useCallback(
    (apply: () => void) => {
      // На вебе снимков нет, а нажатия во время перехода меняют тему сразу
      if (Platform.OS === 'web' || busy.current || !rootRef.current) {
        apply();
        return;
      }
      busy.current = true;
      captureRef(rootRef, { format: 'jpg', quality: 0.9, result: 'tmpfile' })
        .then((uri) => {
          pendingApply.current = apply;
          opacity.value = 1;
          setSnapshot(uri);
        })
        .catch(() => {
          // Снимок не получился — тема важнее анимации
          busy.current = false;
          apply();
        });
    },
    [opacity],
  );

  const onSnapshotLoad = () => {
    applyPending();
    // Два кадра: новая тема из эффекта провайдера должна лечь под снимок до начала растворения
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        opacity.value = withTiming(0, { duration: FADE_MS }, (done) => {
          if (done) scheduleOnRN(finish);
        });
      }),
    );
  };

  const onSnapshotError = () => {
    applyPending();
    finish();
  };

  return { rootRef, snapshot, opacity, onSnapshotLoad, onSnapshotError, transition };
};

export type ThemeTransition = ReturnType<typeof useThemeTransition>;

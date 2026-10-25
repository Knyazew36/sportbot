import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/shared/lib/utils';
import { Lanes } from '@/shared/ui/kit/Lanes';
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography';

import { FocusScoreboard, type FocusSets } from './FocusScoreboard';

type FocusShellProps = {
  /** Что происходит: «пауза», «отдых»; в круге суперсета — только пауза, цепочка и так видна */
  status?: string;
  /** Акцентом, когда статус требует действия: пауза, отдых закончился */
  alert?: boolean;
  /** Название упражнения; в круге суперсета его нет — круг виден списком */
  title?: ReactNode;
  /** Под названием: что будет дальше в круге суперсета */
  subtitle?: ReactNode;
  /** Над названием: цепочка круга суперсета */
  above?: ReactNode;
  /** Фон-дорожки едут: идёт круг суперсета */
  running?: boolean;
  /** Без sets и startedAt табло нет — разминка: подхода ещё нет, а общее время там лишнее */
  sets?: FocusSets;
  /** Начало тренировки — общее время на табло, пока шапка экрана упражнения закрыта */
  startedAt?: string;
  /**
   * Пауза: гасим весь экран, кроме середины с кнопкой «дальше». Взгляд сразу на ней,
   * а случайный тап по тёмному не жмёт «Закончил» или «Отменить»
   */
  dim?: boolean;
  /** Поверх затемнения по центру экрана: кнопка «дальше» на паузе круга */
  overlay?: ReactNode;
  children: ReactNode;
  /** Крупные кнопки внизу, под большой палец */
  actions: ReactNode;
};

// Полный экран на время подхода и отдыха: только время и пара крупных кнопок — после подхода дрожат руки.
// Фон темы, а не чёрная плашка: в тёмной теме плашка светлая и слепила бы весь экран
export const FocusShell = ({
  status,
  alert,
  title,
  subtitle,
  above,
  running,
  sets,
  startedAt,
  dim,
  overlay,
  children,
  actions,
}: FocusShellProps) => {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-background absolute inset-0 z-[45]">
      <Lanes running={running} className={running ? 'opacity-[0.1]' : 'opacity-[0.06]'} />
      {/* Название целиком, до двух строк: «Жим гантелей на наклонной…» с многоточием не отличить от соседнего */}
      <View className="gap-3 px-gutter" style={{ paddingTop: insets.top + 16 }}>
        {above}
        {(status || title || subtitle) && (
          <View>
            {status && (
              <Eyebrow tone={alert ? 'primary' : 'muted'} className="mb-1">
                {status}
              </Eyebrow>
            )}
            {title && (
              <Poster size="md" numberOfLines={2}>
                {title}
              </Poster>
            )}
            {subtitle}
          </View>
        )}
        {sets && startedAt && <FocusScoreboard sets={sets} startedAt={startedAt} />}
      </View>
      {/* На паузе середина над затемнением: там кнопка «дальше», цифры гасит сам экран */}
      <View className={cn('flex-1 items-center justify-center gap-6 px-gutter', dim && 'z-20')}>{children}</View>
      <View className="gap-3 px-gutter" style={{ paddingBottom: Math.max(20, insets.bottom) }}>
        {actions}
      </View>
      {dim && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="bg-background/85 absolute inset-0 z-10"
        />
      )}
      {overlay && (
        <View pointerEvents="box-none" className="absolute inset-0 z-30 items-center justify-center">
          {overlay}
        </View>
      )}
    </View>
  );
};

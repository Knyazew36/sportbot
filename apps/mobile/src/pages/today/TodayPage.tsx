import { useState } from 'react';
import { ArrowRight } from 'lucide-react-native';

import { type DayToday } from '@sportbot/api/entities/day';
import { usePickComplex, useToday } from '@/shared/local/entities/day';
import { useFinishQueued } from '@/shared/local/entities/workout';

import { capitalize, formatDate } from '@/shared/lib/format';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader';

import { SessionExpiredBanner } from '@/widgets/session-expired/SessionExpiredBanner';

import { DoneDay } from './components/DoneDay';
import { FinishQueuedDay } from './components/FinishQueuedDay';
import { InProgressDay } from './components/InProgressDay';
import { MissedDay } from './components/MissedDay';
import { NoProgramDay } from './components/NoProgramDay';
import { PauseDay } from './components/PauseDay';
import { RestDay } from './components/RestDay';
import { TrainingDay } from './components/TrainingDay';
import { dayCta } from './model/cta';

// Пока тренировка идёт, дата не важна — шапка говорит, что происходит
const headerTitle = (day: DayToday | undefined, finishQueued: boolean) => {
  if (!day) return 'Сегодня';
  if (day.state === 'IN_PROGRESS' && !finishQueued) return 'Тренировка идёт';
  return capitalize(formatDate(day.date, 'EEEE · d MMMM'));
};

// Главный экран (frontend-tz, 7) — порт pages/today: одно из состояний дня, серия, неделя и что дальше.
// Баннера «бот не может писать» нет: в приложении напоминания придут push-уведомлениями (MOBILE_TZ.md, раздел 11)
const TodayPage = () => {
  const today = useToday();
  const pick = usePickComplex();
  // Три пропуска подряд — ответ на «не буду» один раз предлагает паузу
  const [suggestPause, setSuggestPause] = useState(false);

  // Завершение ждёт сети: сервер ещё говорит «идёт», но продолжать уже нечего
  const finishQueued = useFinishQueued(today.data?.workout?.id);
  const action = today.data && !finishQueued ? dayCta(today.data) : null;

  return (
    <Screen
      onRefresh={() => void today.refetch()}
      refreshing={today.isRefetching}
      header={
        <ScreenHeader title={headerTitle(today.data, finishQueued)} />
      }
      footer={
        action && (
          <StickyFooter>
            <ButtonLink href={action.href} variant={action.variant} size="lg" iconRight={ArrowRight}>
              {action.label}
            </ButtonLink>
          </StickyFooter>
        )
      }
    >
      <SessionExpiredBanner />
      <QueryState query={today}>
        {(day) => (
          <>
            {day.state === 'TRAINING' && day.complex && (
              <TrainingDay day={day} onPickComplex={pick.mutate} onMissed={setSuggestPause} />
            )}
            {day.state === 'REST' && <RestDay day={day} />}
            {day.state === 'IN_PROGRESS' &&
              day.workout &&
              (finishQueued ? <FinishQueuedDay day={day} /> : <InProgressDay day={day} />)}
            {day.state === 'DONE' && <DoneDay day={day} />}
            {day.state === 'MISSED' && <MissedDay day={day} suggestPause={suggestPause} />}
            {day.state === 'PAUSE' && day.pause && <PauseDay day={day} />}
            {/* Комплекс дня не нашёлся — программа пустая */}
            {(day.state === 'NO_PROGRAM' || (day.state === 'TRAINING' && !day.complex)) && <NoProgramDay />}
          </>
        )}
      </QueryState>
    </Screen>
  );
};

export default TodayPage;

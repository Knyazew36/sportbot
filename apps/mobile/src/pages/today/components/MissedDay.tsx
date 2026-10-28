import { View } from 'react-native';

import { type DayToday } from '@sportbot/api/entities/day';
import { useFixDay, useRescheduleAnswer } from '@/shared/local/entities/day';

import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { Notice } from '@/shared/ui/kit/Notice';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Lead, Poster, Text } from '@/shared/ui/kit/Typography';

import { NextUp } from './NextUp';
import { WeekStreak } from './WeekStreak';

type MissedDayProps = {
  day: DayToday;
  /** Три пропуска подряд — после ответа «не буду» предложить паузу */
  suggestPause: boolean;
};

// День отмечен пропуском — порт MissedDay.tsx. Исправить (business-tz, 8.3): тренировка была без записи —
// отметить её; или потренироваться сейчас (кнопка внизу) — записанная тренировка сама закроет пропуск
export const MissedDay = ({ day, suggestPause }: MissedDayProps) => {
  const reschedule = useRescheduleAnswer();
  const fix = useFixDay();
  const dayId = day.dayId;

  return (
    <>
      <Rise className="px-gutter">
        <Lead>сегодня —</Lead>
        <Poster size="hero" tone="primary" numberOfLines={1} adjustsFontSizeToFit>
          пропуск
        </Poster>
        {day.streak.best > 0 && (
          <Lead size="md" tone="soft" className="mt-2">
            серия прервалась · рекорд серии {day.streak.best} остаётся
          </Lead>
        )}
      </Rise>

      {dayId && (
        <Rise className="px-gutter">
          <ConfirmAction
            title="Тренировка всё-таки была?"
            description="Отмечу день тренировкой дня по очереди, серия пересчитается."
            confirmLabel="Отметить"
            confirmVariant="default"
            onConfirm={() => fix.mutateAsync({ dayId, status: 'DONE' })}
            trigger={<Button variant="outline" block />}
          >
            Исправить: тренировка была
          </ConfirmAction>
        </Rise>
      )}

      {day.rescheduleOffered && (
        <Rise className="border-primary mx-gutter gap-3 border-[1.5px] p-4">
          <Eyebrow tone="primary">Перенос</Eyebrow>
          <Poster size="lg">Напомнить завтра?</Poster>
          <Text size="sm" tone="soft">
            Завтра утром бот спросит про тренировку, хоть день и не по расписанию.
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button block disabled={reschedule.isPending} onPress={() => reschedule.mutate(true)}>
                Да, завтра
              </Button>
            </View>
            <View className="flex-1">
              <Button block variant="outline" disabled={reschedule.isPending} onPress={() => reschedule.mutate(false)}>
                Нет
              </Button>
            </View>
          </View>
        </Rise>
      )}

      {suggestPause && (
        <Rise className="px-gutter">
          <Notice kicker="три пропуска подряд" description="Можно поставить паузу — серия сохранится, бот помолчит.">
            <ButtonLink href={{ pathname: ROUTES.ME_SECTION, params: { section: 'training' } }} variant="outline">
              Поставить паузу
            </ButtonLink>
          </Notice>
        </Rise>
      )}

      <NextUp day={day} />
      <WeekStreak week={day.week} />
    </>
  );
};

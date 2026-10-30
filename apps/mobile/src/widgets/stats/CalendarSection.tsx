import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { type Href, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { addMonths, format, getDaysInMonth, parseISO } from 'date-fns';

import { type StatsDay } from '@sportbot/api/entities/stats';
import { useCalendar, useStatsDay } from '@/shared/local/entities/stats';

import { routeHref, ROUTES } from '@/shared/config/routes';
import { capitalize, formatDate } from '@/shared/lib/format';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography';

import { DayWorkout } from './DayWorkout';
import { DAY_MARK, MARK_LABEL } from './marks';
import { MonthCalendar } from './MonthCalendar';

const workoutLink = (workoutId: number, month: string) => routeHref(ROUTES.STATS_WORKOUT, { workoutId, month });

// Свой день с тренировками уходит на свой экран: одна — сразу на неё, несколько — на разводящую дня
const dayLink = (workouts: StatsDay['workouts'], date: string | null, month: string): Href | null => {
  if (!date || !workouts.length) return null;
  if (workouts.length === 1) return workoutLink(workouts[0]!.id, month);
  return routeHref(ROUTES.STATS_DAY, { date });
};

// Детали дня под календарём: день друга с составом тренировок.
// Свои тренировки открываются отдельным экраном, правка и удаление — там
const DayDetails = ({ day }: { day: StatsDay }) => (
  <View className="border-foreground/80 mt-2 gap-3 border-[1.5px] p-4">
    <View className="flex-row items-baseline justify-between gap-3">
      <Poster size="lg">{formatDate(day.date, 'd MMMM')}</Poster>
      <Eyebrow tone="primary">{MARK_LABEL[DAY_MARK[day.mark]]}</Eyebrow>
    </View>
    {day.workouts.map((w) => (
      <DayWorkout key={w.id} workout={w} />
    ))}
  </View>
);

type CalendarSectionProps = {
  /** Календарь друга — без исправления отметок */
  userId?: number;
};

// Календарь месяца с отметками и деталями дня — порт widgets/stats/CalendarSection.tsx
export const CalendarSection = ({ userId }: CalendarSectionProps) => {
  // Текущий месяц фиксируем при открытии: дальше него листать некуда
  const [current] = useState(() => format(new Date(), 'yyyy-MM'));
  // Месяц в параметрах экрана: с экрана тренировки «Назад» возвращает на тот же месяц
  const params = useLocalSearchParams<{ month?: string }>();
  const month = params.month ?? current;
  const [selected, setSelected] = useState<string | null>(null);
  const calendar = useCalendar(month, userId);
  const day = useStatsDay(selected, userId);
  const own = userId == null;
  const workouts = own && day.data?.date === selected ? day.data.workouts : [];
  const target = dayLink(workouts, selected, month);

  useEffect(() => {
    if (target) router.push(target);
  }, [target]);

  // Вернулись с экрана тренировки — выбор дня снимаем, иначе календарь сразу уведёт туда снова
  useFocusEffect(useCallback(() => () => setSelected(null), []));

  const first = parseISO(`${month}-01`);
  // Понедельник — первая колонка
  const lead = (first.getDay() + 6) % 7;
  const marks = new Map((calendar.data ?? []).map((d) => [d.date, d.mark]));
  const days = Array.from({ length: getDaysInMonth(first) }, (_, i) => {
    const date = `${month}-${String(i + 1).padStart(2, '0')}`;
    return { day: i + 1, mark: DAY_MARK[marks.get(date) ?? 'REST'] };
  });
  const shift = (by: number) => {
    router.setParams({ month: format(addMonths(first, by), 'yyyy-MM') });
    setSelected(null);
  };

  return (
    <MonthCalendar
      month={capitalize(formatDate(first, 'LLLL yyyy'))}
      lead={lead}
      days={days}
      selected={selected ? Number(selected.slice(-2)) : undefined}
      onSelect={(d) => {
        const date = `${month}-${String(d).padStart(2, '0')}`;
        // Нажимается только день с тренировкой
        setSelected(date);
      }}
      onPrev={() => shift(-1)}
      onNext={month < current ? () => shift(1) : undefined}
    >
      {selected ? <QueryState query={day}>{(d) => (d.workouts.length ? <DayDetails day={d} /> : null)}</QueryState> : null}
    </MonthCalendar>
  );
};

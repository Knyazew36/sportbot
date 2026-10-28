import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { addDays, addWeeks, format, parseISO } from 'date-fns';
import { Check, ChevronLeft, ChevronRight, Pause, X, type LucideIcon } from 'lucide-react-native';

import type { DayToday } from '@sportbot/api/entities/day';
import { useCalendarMonths, usePrefetchStatsDays } from '@/shared/local/entities/stats';

import { formatDate } from '@/shared/lib/format';
import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';
import { weekdayShort } from '@/shared/lib/weekdays';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { InkPanel } from '@/shared/ui/kit/InkPanel';
import { Eyebrow, Poster, Text, TextClassContext } from '@/shared/ui/kit/Typography';
import { DAY_MARK, MARK_LABEL, type DayMark } from '@/widgets/stats/marks';

import { TODAY_MARK, weekTitle, workoutsText } from '../model/week';
import { Pressable } from '@/shared/ui/kit/Pressable';
import { Pulse } from '@/shared/ui/kit/ScreenState';

type WeekCell = { date: string; weekday: number; mark: DayMark; isToday: boolean };

// Клетки на чёрной плашке: те же голоса, что в календаре посещений, но светлым по тёмному — классы фронта.
// Тренировка с тенью кнопки, потому что открывает шторку
// Пока грузится прошлая неделя, даты уже известны — показываем их приглушённо, без отметок
const LOADING_CELL = { box: 'border-background/25 bg-background/10', text: 'text-background/50' };

const CELL: Record<DayMark, { box: string; text: string }> = {
  done: { box: 'border-background bg-primary', text: 'text-primary-foreground' },
  skip: { box: 'border-background/70', text: 'text-background/70' },
  pause: { box: 'border-background/30 bg-background/10', text: 'text-background/60' },
  moved: { box: 'border-primary', text: 'text-primary' },
  pending: { box: 'border-primary border-dashed', text: 'text-primary' },
  rest: { box: 'border-transparent', text: 'text-background/35' },
  future: { box: 'border-background/25', text: 'text-background/60' },
};

const MARK_ICON: Partial<Record<DayMark, LucideIcon>> = { done: Check, skip: X, pause: Pause };

type WeekStripProps = {
  week: DayToday['week'];
  onOpenDay: (date: string) => void;
};

// Неделя чёрной плашкой — порт WeekStrip.tsx: текущая по умолчанию, прошлые листаются кнопками.
// Свайпа нет — в ленте он спорил бы с прокруткой экрана
export const WeekStrip = ({ week, onOpenDay }: WeekStripProps) => {
  const [offset, setOffset] = useState(0);

  const monday = addWeeks(parseISO(week[0]!.date), offset);
  const dates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  // Текущую неделю отдаёт главная, календарь нужен только прошлым
  const calendar = useCalendarMonths(offset === 0 ? [] : [...new Set(dates.map((d) => format(d, 'yyyy-MM')))]);
  const loading = offset !== 0 && calendar.isPending;

  const cells: WeekCell[] =
    offset === 0
      ? week.map((d) => ({ ...d, mark: TODAY_MARK[d.mark] }))
      : dates.map((d) => {
          const date = format(d, 'yyyy-MM-dd');
          return { date, weekday: d.getDay(), mark: DAY_MARK[calendar.marks.get(date) ?? 'FUTURE'], isToday: false };
        });
  const done = cells.filter((c) => c.mark === 'done').map((c) => c.date);
  usePrefetchStatsDays(loading ? [] : done);

  return (
    <View className="px-gutter">
      <InkPanel shadow className="gap-5 p-5">
        <View className="flex-row items-end justify-between gap-3">
          <View className="min-w-0 shrink gap-2">
            <Eyebrow tone="inverseMuted">{loading ? 'Загружаю…' : workoutsText(done.length)}</Eyebrow>
            <Poster size="lg" numeric>
              {weekTitle(offset, monday)}
            </Poster>
          </View>
          <View className="flex-row gap-2">
            <Button variant="paper" size="icon" accessibilityLabel="Предыдущая неделя" onPress={() => setOffset((o) => o - 1)}>
              <Icon as={ChevronLeft} strokeWidth={2.5} className="size-5" />
            </Button>
            <Button
              variant="paper"
              size="icon"
              accessibilityLabel="Следующая неделя"
              disabled={offset === 0}
              onPress={() => setOffset((o) => o + 1)}
            >
              <Icon as={ChevronRight} strokeWidth={2.5} className="size-5" />
            </Button>
          </View>
        </View>

        <Row loading={loading}>
          {cells.map((c) => {
            const look = loading ? LOADING_CELL : CELL[c.mark];
            const MarkIcon = loading ? undefined : MARK_ICON[c.mark];
            const label = `${formatDate(c.date, 'd MMMM')}: ${MARK_LABEL[c.mark].toLowerCase()}`;
            const clickable = c.mark === 'done' && !loading;

            const cell = (pressed: boolean) => (
              <View
                className={cn(
                  'h-16 items-center justify-center gap-1.5 border-[1.5px]',
                  look.box,
                  pressed && 'translate-x-[2px] translate-y-[2px]',
                )}
              >
                <TextClassContext.Provider value={look.text}>
                  <Text className="text-[10px] leading-[10px] tracking-[0.8px] uppercase opacity-75">
                    {weekdayShort(c.weekday)}
                  </Text>
                  <Poster size="md" numeric>
                    {formatDate(c.date, 'd')}
                  </Poster>
                  {MarkIcon && <Icon as={MarkIcon} strokeWidth={3} className="absolute top-1 right-1 size-3" />}
                </TextClassContext.Provider>
              </View>
            );

            return (
              <View key={c.date} className="flex-1">
                {clickable ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${label}, открыть`}
                    onPress={() => {
                      haptic.tap();
                      onOpenDay(c.date);
                    }}
                  >
                    {({ pressed }) => (
                      <View>
                        {/* Жёсткая тень кнопки цветом бумаги: shadow-[2px_2px_0_var(--sb-paper)] */}
                        <View className="bg-sb-paper absolute inset-0 translate-x-[2px] translate-y-[2px]" />
                        {cell(pressed)}
                      </View>
                    )}
                  </Pressable>
                ) : (
                  <View accessibilityLabel={label}>{cell(false)}</View>
                )}
                {c.isToday && (
                  <View className="bg-attention border-background absolute -bottom-1 left-1/2 -ml-2.5 h-2 w-5 border-[1.5px]" />
                )}
              </View>
            );
          })}
        </Row>
      </InkPanel>
    </View>
  );
};

// Ряд клеток мерцает, пока грузится прошлая неделя
const Row = ({ loading, children }: { loading: boolean; children: ReactNode }) =>
  loading ? (
    <Pulse className="flex-row gap-1.5">{children}</Pulse>
  ) : (
    <View className="flex-row gap-1.5">{children}</View>
  );

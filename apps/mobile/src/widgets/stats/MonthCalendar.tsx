import type { ReactNode } from 'react';
import { View } from 'react-native';
import { ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react-native';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { Hatch } from '@/shared/ui/kit/Patterns';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';

import { type DayMark, MARK_LABEL } from './marks';
import { Pressable } from '@/shared/ui/kit/Pressable';

// Одна раскладка цвета на клетку и её образец в легенде. Штриховка паузы — узором Hatch поверх
const MARK_CELL: Record<DayMark, string> = {
  done: 'bg-primary border-primary',
  skip: 'border-foreground/70',
  pause: 'border-border',
  moved: 'border-primary',
  pending: 'border-primary border-dashed',
  rest: 'border-transparent',
  future: 'border-foreground/20',
};

const MARK_TEXT: Record<DayMark, string> = {
  done: 'text-primary-foreground',
  skip: 'text-foreground/70',
  pause: 'text-foreground/60',
  moved: 'text-primary',
  pending: 'text-primary',
  rest: 'text-foreground/35',
  future: 'text-foreground/60',
};

const LEGEND: DayMark[] = ['done', 'skip', 'moved', 'pending', 'pause', 'future'];

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

type MonthCalendarProps = {
  month: string;
  /** Сколько пустых клеток до первого числа (понедельник — 0) */
  lead: number;
  days: { day: number; mark: DayMark }[];
  selected?: number;
  onSelect?: (day: number) => void;
  /** Детали выбранного дня под календарём */
  children?: ReactNode;
  /** Листание месяцев; без них — только название месяца */
  onPrev?: () => void;
  onNext?: () => void;
};

type Cell = { day: number; mark: DayMark } | null;

// Календарь месяца с отметками дней — порт widgets/stats/MonthCalendar.tsx: тренировка, пропуск, перенос, пауза.
// Сетка 7 колонок — рядами недель: CSS grid в RN нет
export const MonthCalendar = ({ month, lead, days, selected, onSelect, children, onPrev, onNext }: MonthCalendarProps) => {
  const { colors } = useTheme();
  const cells: Cell[] = [...Array.from({ length: lead }, () => null), ...days];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  return (
    <ScreenSection
      title="Календарь"
      action={
        <View className="flex-row items-center gap-2">
          {onPrev && (
            <Button variant="outline" size="icon-sm" accessibilityLabel="Прошлый месяц" onPress={onPrev}>
              <Icon as={ChevronLeft} className="size-4" />
            </Button>
          )}
          <Poster>{month}</Poster>
          {onNext && (
            <Button variant="outline" size="icon-sm" accessibilityLabel="Следующий месяц" onPress={onNext}>
              <Icon as={ChevronRight} className="size-4" />
            </Button>
          )}
        </View>
      }
    >
      <View className="gap-1.5">
        <View className="flex-row gap-1.5">
          {WEEKDAYS.map((d) => (
            <Eyebrow key={d} size="sm" className="flex-1 pb-1 text-center">
              {d}
            </Eyebrow>
          ))}
        </View>
        {weeks.map((week, w) => (
          <View key={w} className="flex-row gap-1.5">
            {week.map((cell, i) =>
              cell ? (
                <Pressable
                  key={cell.day}
                  disabled={!onSelect}
                  accessibilityRole="button"
                  accessibilityLabel={`${cell.day} ${month.toLowerCase()}: ${MARK_LABEL[cell.mark]}`}
                  accessibilityState={{ selected: selected === cell.day }}
                  onPress={() => {
                    haptic.tap();
                    onSelect?.(cell.day);
                  }}
                  // Кольцо выбранного дня с зазором — ring-offset фронта: рамка снаружи клетки
                  className={cn(
                    'aspect-square flex-1 border-2 p-[2px]',
                    selected === cell.day ? 'border-foreground' : 'border-transparent',
                  )}
                >
                  {({ pressed }) => (
                    <View
                      className={cn(
                        'flex-1 items-center justify-center overflow-hidden border-[1.5px]',
                        MARK_CELL[cell.mark],
                        pressed && 'scale-95',
                      )}
                    >
                      {cell.mark === 'pause' && <Hatch color={colors.hatch} />}
                      {cell.mark === 'skip' && (
                        <Icon as={X} strokeWidth={1.25} className="text-foreground/30 absolute size-8" />
                      )}
                      <Text
                        className={cn(
                          MARK_TEXT[cell.mark],
                          cell.mark === 'done' ? 'font-display text-[17px] leading-[19px]' : 'text-[13px] leading-[16px]',
                        )}
                      >
                        {cell.day}
                      </Text>
                      {cell.mark === 'moved' && (
                        <Icon as={ArrowRight} className="text-primary absolute right-0.5 bottom-0.5 size-2.5" />
                      )}
                      {cell.mark === 'pending' && (
                        <Text className="text-primary absolute top-0.5 right-1 text-[9px] leading-[10px]">?</Text>
                      )}
                    </View>
                  )}
                </Pressable>
              ) : (
                <View key={`pad-${w}-${i}`} className="aspect-square flex-1" />
              ),
            )}
          </View>
        ))}
      </View>
      <View className="mt-1 flex-row flex-wrap gap-x-4 gap-y-2">
        {LEGEND.map((m) => (
          <View key={m} className="flex-row items-center gap-1.5">
            <View className={cn('size-3 overflow-hidden border-[1.5px]', MARK_CELL[m])}>
              {m === 'pause' && <Hatch color={colors.hatch} />}
            </View>
            <Text size="2xs" tone="soft">
              {MARK_LABEL[m]}
            </Text>
          </View>
        ))}
      </View>
      {children}
    </ScreenSection>
  );
};

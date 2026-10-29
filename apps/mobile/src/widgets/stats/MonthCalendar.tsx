import type { ReactNode } from 'react';
import { View } from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';

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
  done: 'bg-primary border-foreground',
  skip: 'border-foreground/70',
  pause: 'border-border',
  plan: 'border-primary',
  rest: 'border-transparent',
};

const MARK_TEXT: Record<DayMark, string> = {
  done: 'text-primary-foreground',
  skip: 'text-foreground/70',
  pause: 'text-foreground/60',
  plan: 'text-primary',
  rest: 'text-foreground/35',
};

const LEGEND: DayMark[] = ['done', 'skip', 'plan', 'pause'];

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

type DayCellProps = {
  cell: { day: number; mark: DayMark };
  label: string;
  selected: boolean;
  hatch: string;
  /** Есть только у дня с тренировкой */
  onPress?: () => void;
};

// Клетка дня. Кольцо выбранного дня с зазором — ring-offset фронта: рамка снаружи клетки
const DayCell = ({ cell, label, selected, hatch, onPress }: DayCellProps) => {
  const box = (pressed: boolean) => (
    <View
      className={cn(
        'flex-1 items-center justify-center overflow-hidden border-[1.5px]',
        MARK_CELL[cell.mark],
        pressed && 'translate-x-[2px] translate-y-[2px]',
      )}
    >
      {cell.mark === 'pause' && <Hatch color={hatch} />}
      {cell.mark === 'skip' && <Icon as={X} strokeWidth={1.25} className="text-foreground/30 absolute size-8" />}
      <Text
        className={cn(
          MARK_TEXT[cell.mark],
          cell.mark === 'done' ? 'font-display text-[17px] leading-[19px]' : 'text-[13px] leading-[16px]',
        )}
      >
        {cell.day}
      </Text>
    </View>
  );
  const ring = cn('aspect-square flex-1 border-2 p-[2px]', selected ? 'border-foreground' : 'border-transparent');

  if (!onPress)
    return (
      <View accessibilityLabel={label} className={ring}>
        {box(false)}
      </View>
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, открыть`}
      accessibilityState={{ selected }}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      className={ring}
    >
      {({ pressed }) => (
        <View className="flex-1">
          {/* Жёсткая тень кнопки: shadow-[2px_2px_0_var(--sb-ink)] */}
          <View className="bg-sb-ink absolute inset-0 translate-x-[2px] translate-y-[2px]" />
          {box(pressed)}
        </View>
      )}
    </Pressable>
  );
};

// Календарь месяца с отметками дней — порт widgets/stats/MonthCalendar.tsx: тренировка, пропуск, тренировочный день,
// пауза. Нажимается только тренировка — у неё тень кнопки, остальные клетки просто показывают отметку.
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
                <DayCell
                  key={cell.day}
                  cell={cell}
                  label={`${cell.day} ${month.toLowerCase()}: ${MARK_LABEL[cell.mark]}`}
                  selected={selected === cell.day}
                  hatch={colors.hatch}
                  onPress={onSelect && cell.mark === 'done' ? () => onSelect(cell.day) : undefined}
                />
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

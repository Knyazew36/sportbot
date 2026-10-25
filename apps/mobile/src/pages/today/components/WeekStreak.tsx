import { useState } from 'react';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import type { DayToday } from '@sportbot/api/entities/day';

import { ROUTES } from '@/shared/config/routes';
import { Icon } from '@/shared/ui/kit/Icon';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow } from '@/shared/ui/kit/Typography';

import { StreakDaySheet } from './StreakDaySheet';
import { WeekStrip } from './WeekStrip';
import { Pressable } from '@/shared/ui/kit/Pressable';

type WeekStreakProps = Pick<DayToday, 'week'> & {
  /** Вход в посещения: нужен, только когда шапки с ним нет — во время тренировки */
  withAttendance?: boolean;
};

// Недели с отметками лентой — порт WeekStreak.tsx; тренировка открывается шторкой с деталями и «Поделиться»
export const WeekStreak = ({ week, withAttendance }: WeekStreakProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDate, setSheetDate] = useState<string | null>(null);

  return (
    <Rise>
      <WeekStrip
        week={week}
        onOpenDay={(date) => {
          setSheetDate(date);
          setSheetOpen(true);
        }}
      />
      {withAttendance && (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push({ pathname: ROUTES.STATS, params: { tab: 'attendance' } })}
          className="mx-gutter mt-1 flex-row items-center justify-between py-2 active:opacity-60"
        >
          <Eyebrow tone="primary">Посещения и календарь</Eyebrow>
          <Icon as={ChevronRight} className="text-primary size-4" />
        </Pressable>
      )}
      <StreakDaySheet open={sheetOpen} onOpenChange={setSheetOpen} date={sheetDate} />
    </Rise>
  );
};

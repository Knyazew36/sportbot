import { useState } from 'react';

import type { DayToday } from '@sportbot/api/entities/day';

import { Rise } from '@/shared/ui/kit/Reveal';

import { StreakDaySheet } from './StreakDaySheet';
import { WeekStrip } from './WeekStrip';

type WeekStreakProps = Pick<DayToday, 'week'>;

// Недели с отметками лентой — порт WeekStreak.tsx; тренировка открывается шторкой с деталями и «Поделиться»
export const WeekStreak = ({ week }: WeekStreakProps) => {
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
      <StreakDaySheet open={sheetOpen} onOpenChange={setSheetOpen} date={sheetDate} />
    </Rise>
  );
};

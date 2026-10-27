import type { DayToday } from '@sportbot/api/entities/day';

import { RestArt } from '@/shared/ui/kit/art-skia/RestArt';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Lead, Poster } from '@/shared/ui/kit/Typography';

import { ForgottenMuscles } from './ForgottenMuscles';
import { NextUp } from './NextUp';
import { WeekStreak } from './WeekStreak';

// Нетренировочный день — порт RestDay.tsx: когда следующая и что там; можно всё равно потренироваться (7.2)
export const RestDay = ({ day }: { day: DayToday }) => (
  <>
    <Rise className="px-gutter">
      <Lead>сегодня —</Lead>
      <Poster size="hero" tone="primary" numberOfLines={1} adjustsFontSizeToFit>
        отдых
      </Poster>
      <RestArt className="mt-2" />
    </Rise>
    {/* «Потренироваться» — в липком низу экрана, над меню */}
    <NextUp day={day} label="следующая по расписанию" />
    <WeekStreak week={day.week} />
    <ForgottenMuscles />
  </>
);

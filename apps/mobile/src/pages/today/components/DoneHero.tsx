import { pluralize } from '@front-cmdt/utils/pluralize';

import type { DayToday } from '@sportbot/api/entities/day';

import { DAY_FORMS } from '@/shared/lib/plural-forms';
import { PodiumArt } from '@/shared/ui/kit/Art';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Lead, Poster } from '@/shared/ui/kit/Typography';

import { streakNote } from '../model/streak';

// Засчитано — порт DoneHero.tsx: гиря на пьедестале, серия крупно текстом, подпись про рекорд серии
export const DoneHero = ({ day }: { day: DayToday }) => (
  <>
    <Rise>
      <PodiumArt />
    </Rise>
    <Rise className="px-gutter items-center">
      <Eyebrow tone="primary" className="text-center">
        {day.workoutsToday > 1 ? `${day.workoutsToday} тренировки сегодня ✅` : 'Тренировка засчитана ✅'}
      </Eyebrow>
      <Poster size="3xl" className="mt-3 text-center">
        {pluralize(day.streak.current, DAY_FORMS)} подряд
      </Poster>
      <Lead size="md" tone="soft" className="mt-2 text-center">
        {streakNote(day.streak)}
      </Lead>
    </Rise>
  </>
);

import { View } from 'react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { useProfile } from '@sportbot/api/entities/profile';
import { motivationFor, type WorkoutSummary } from '@sportbot/api/entities/workout';
import { FinishArt } from '@/shared/ui/kit/Art';
import { InkPanel } from '@/shared/ui/kit/InkPanel';
import { Eyebrow, Lead, Poster } from '@/shared/ui/kit/Typography';
import { DAY_FORMS } from '@/shared/lib/plural-forms';

// Шапка итога как табло финиша: вердикт с фразой, время на финише и серия.
// Время — главное число экрана: раньше его на итоге не было вовсе
export const SummaryHero = ({ summary }: { summary: WorkoutSummary }) => {
  const profile = useProfile();
  const counted = summary.status !== 'IN_PROGRESS';

  return (
    <View className="gap-6 px-gutter">
      <View>
        <Lead>тренировка</Lead>
        <Poster size="display" tone="primary">
          {counted ? 'засчитана' : 'идёт'}
        </Poster>
        {/* Фраза ждёт профиль: без пола сначала мелькнула бы нейтральная и сменилась */}
        {counted && profile.data && (
          <Lead size="sm" className="mt-3 max-w-[18ch]">
            {motivationFor(summary.workoutId, profile.data.gender)}
          </Lead>
        )}

        {/* Засчитана — гиря рвёт финишную ленту; пока идёт, финиша ещё не было */}
        {counted && <FinishArt className="mt-4 w-full" />}

        {/* Финишная черта: толстая линейка, под ней время */}
        <View className="border-foreground mt-6 flex-row items-end gap-4 border-t-[3px] pt-3">
          <View className="min-w-0 flex-1">
            {/* От «Начать» до «Завершить»: разминка, подходы и отдых вместе */}
            <Eyebrow>длительность</Eyebrow>
            <View className="mt-1 flex-row items-baseline gap-2">
              <Poster size="5xl" numeric>
                {summary.minutes}
              </Poster>
              <Poster size="lg" tone="soft">
                мин
              </Poster>
            </View>
          </View>
        </View>
      </View>

      <InkPanel className="flex-row items-end justify-between gap-4 px-4 py-4">
        <Eyebrow className="text-background/60 pb-1">серия</Eyebrow>
        <Poster size="3xl" numeric>
          {pluralize(summary.currentStreak, DAY_FORMS)}
        </Poster>
      </InkPanel>
    </View>
  );
};

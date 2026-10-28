import { View } from 'react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { useProfile } from '@/shared/local/entities/profile';
import { motivationFor, type WorkoutSummary } from '@sportbot/api/entities/workout';
import { DAY_FORMS } from '@/shared/lib/plural-forms';
import { GUTTER } from '@/shared/theme/tokens';
import { FinishArt } from '@/shared/ui/kit/Art';
import { InkPanel } from '@/shared/ui/kit/InkPanel';
import { Lanes } from '@/shared/ui/kit/Lanes';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Lead, Poster } from '@/shared/ui/kit/Typography';

// Шапка итога как табло финиша: вердикт с фразой, время на финише и серия.
// Время — главное число экрана: раньше его на итоге не было вовсе
export const SummaryHero = ({ summary }: { summary: WorkoutSummary }) => {
  const profile = useProfile();
  const counted = summary.status !== 'IN_PROGRESS';

  return (
    <>
      <Rise className="px-gutter">
        <Lead>тренировка</Lead>
        {/* Мягкий перенос: «засчитана» плакатом не влезает в узкий экран целиком */}
        <Poster size="display" tone="primary">
          {counted ? 'засчи­тана' : 'идёт'}
        </Poster>
        {/* Фраза ждёт профиль: без пола сначала мелькнула бы нейтральная и сменилась */}
        {counted && profile.data && (
          <Lead size="sm" className="mt-3 max-w-[260px]">
            {motivationFor(summary.workoutId, profile.data.gender)}
          </Lead>
        )}

        {/* Засчитана — гиря рвёт финишную ленту на всю ширину экрана; пока идёт, финиша ещё не было */}
        {counted && (
          <View className="mt-4" style={{ marginHorizontal: -GUTTER }}>
            <FinishArt />
          </View>
        )}

        {/* Финишная черта: толстая линейка, под ней время */}
        <View className="border-foreground mt-6 flex-row items-end gap-4 border-t-[3px] pt-3">
          <View className="min-w-0">
            {/* От «Начать» до «Завершить»: разминка, подходы и отдых вместе */}
            <Eyebrow>длительность</Eyebrow>
            <View className="mt-1 flex-row items-baseline gap-2">
              <Poster size="5xl" numeric>
                {String(summary.minutes)}
              </Poster>
              <Poster size="lg" tone="soft">
                мин
              </Poster>
            </View>
          </View>
          {/* Дорожки уходят за край — забег окончен, разметка осталась */}
          <View className="mb-2 h-14 flex-1">
            <Lanes className="opacity-20" />
          </View>
        </View>
      </Rise>

      <Rise className="px-gutter">
        <InkPanel className="flex-row items-end justify-between gap-4 px-4 py-4">
          <Eyebrow tone="inverseMuted" className="pb-1">
            серия
          </Eyebrow>
          <Poster size="3xl">{pluralize(summary.currentStreak, DAY_FORMS)}</Poster>
        </InkPanel>
      </Rise>
    </>
  );
};

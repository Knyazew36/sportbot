import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { type Cooldown } from '@sportbot/api/entities/workout';
import { ROUTES } from '@/shared/config/routes';
import { STRETCH_FORMS } from '@/shared/lib/plural-forms';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Icon } from '@/shared/ui/kit/Icon';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { Lead, Poster } from '@/shared/ui/kit/Typography';

import { StretchMuscles } from './StretchMuscles';

export const OfferView = ({ cooldown }: { cooldown: Cooldown }) => {
  const count = cooldown.main.length + cooldown.optional.length;
  if (!count) return <Redirect href={{ pathname: ROUTES.WORKOUT_SUMMARY, params: { workoutId: String(cooldown.workoutId) } }} />;

  return (
    <Screen
      fullscreen
      footer={
        <StickyFooter>
          <ButtonLink
            href={{ pathname: ROUTES.WORKOUT_SUMMARY, params: { workoutId: String(cooldown.workoutId) } }}
            replace
            variant="outline"
            size="lg"
          >
            Пропустить
          </ButtonLink>
          <ButtonLink
            href={`${ROUTES.COOLDOWN.replace('[workoutId]', String(cooldown.workoutId))}?start=1`}
            replace
            size="lg"
          >
            Начать
            <Icon as={ArrowRight} className="size-7" strokeWidth={2.5} />
          </ButtonLink>
        </StickyFooter>
      }
      className="px-gutter"
    >
      <View className="flex flex-1 flex-col justify-center">
        <Lead>тренировка засчитана, теперь —</Lead>
        <Poster size="display" tone="primary" className="mt-1">
          заминка
        </Poster>
        <Poster size="xl" numeric className="mt-4">
          ~{cooldown.minutes} мин · {pluralize(count, STRETCH_FORMS)}
        </Poster>
        <StretchMuscles stretches={cooldown.main} />
      </View>
    </Screen>
  );
};

import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { type Cooldown } from '@sportbot/api/entities/workout';
import { ROUTES } from '@/shared/config/routes';
import { STRETCH_FORMS } from '@/shared/lib/plural-forms';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Icon } from '@/shared/ui/kit/Icon';
import { Lanes } from '@/shared/ui/kit/Lanes';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { Lead, Poster } from '@/shared/ui/kit/Typography';

import { StretchMuscles } from './StretchMuscles';

// Сразу после «Завершить»: один вопрос — растянуться сейчас или к итогу
export const OfferView = ({ cooldown }: { cooldown: Cooldown }) => {
  const summary = { pathname: ROUTES.WORKOUT_SUMMARY, params: { workoutId: String(cooldown.workoutId) } };
  const count = cooldown.main.length + cooldown.optional.length;
  // Растяжек под эти мышцы нет — предлагать нечего, сразу итог
  if (!count) return <Redirect href={summary} />;

  return (
    <Screen
      fullscreen
      footer={
        <StickyFooter>
          <ButtonLink href={summary} replace variant="outline" size="lg">
            Пропустить
          </ButtonLink>
          {/* Сразу к первой растяжке: обзор списка здесь был бы вторым предложением подряд */}
          <ButtonLink
            href={{ pathname: ROUTES.COOLDOWN, params: { workoutId: String(cooldown.workoutId), start: '1' } }}
            replace
            size="lg"
          >
            Начать
            <Icon as={ArrowRight} className="size-7" strokeWidth={2.5} />
          </ButtonLink>
        </StickyFooter>
      }
      className="grow px-gutter"
    >
      <Rise className="flex-1 justify-center">
        <Lead>тренировка засчитана, теперь —</Lead>
        <Poster size="display" tone="primary" className="mt-1">
          заминка
        </Poster>
        <Poster size="xl" className="mt-4">
          {`~${cooldown.minutes} мин · ${pluralize(count, STRETCH_FORMS)}`}
        </Poster>
        <StretchMuscles stretches={cooldown.main} />
        {/* «Начать» ведёт сразу к первой растяжке, а выбор комплекса — на обзоре */}
        <ButtonLink
          href={{ pathname: ROUTES.COOLDOWN, params: { workoutId: String(cooldown.workoutId) } }}
          replace
          variant="outline"
          className="mt-4 self-start"
        >
          Выбрать готовый комплекс
        </ButtonLink>
        <View className="mt-6 h-20">
          <Lanes className="opacity-30" />
        </View>
      </Rise>
    </Screen>
  );
};

import { View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { useCooldown } from '@sportbot/api/entities/workout';

import { ROUTES } from '@/shared/config/routes';
import { STRETCH_FORMS } from '@/shared/lib/plural-forms';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { InkPanel } from '@/shared/ui/kit/InkPanel';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';

// Заминка — следующий шаг после финиша — порт widgets/workout/CooldownOffer.tsx: главной плашкой, а не ссылкой.
// Набор с сервера тот же, что откроется в заминке; растяжек под эти мышцы нет — нечего и предлагать
export const CooldownOffer = ({ workoutId }: { workoutId: number }) => {
  const cooldown = useCooldown(workoutId);
  const c = cooldown.data;
  if (!c || c.main.length + c.optional.length === 0) return null;

  return (
    <InkPanel shadow className="gap-4 p-5">
      <View className="gap-2">
        <Eyebrow tone="inverseMuted">Следующий шаг</Eyebrow>
        <Poster size="xl" numeric tone="inverse">
          {`Заминка ~${c.minutes} мин`}
        </Poster>
        <Text tone="inverseMuted">
          {pluralize(c.main.length, STRETCH_FORMS)} на мышцы, которые работали. Таймер запускаешь сам.
        </Text>
      </View>
      <ButtonLink
        href={{ pathname: ROUTES.COOLDOWN, params: { workoutId: String(workoutId) } }}
        variant="paper"
        size="lg"
        block
        spread
        iconRight={ArrowRight}
      >
        Начать заминку
      </ButtonLink>
    </InkPanel>
  );
};

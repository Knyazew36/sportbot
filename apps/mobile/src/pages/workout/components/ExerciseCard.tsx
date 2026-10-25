import { View } from 'react-native';
import { BookOpen, Repeat2, TriangleAlert } from 'lucide-react-native';

import { lastText, planText, type WorkoutItem } from '@sportbot/api/entities/workout';
import { useIsOnline } from '@/shared/api';
import { ROUTES } from '@/shared/config/routes';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Icon } from '@/shared/ui/kit/Icon';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';

type ExerciseCardProps = {
  item: WorkoutItem;
  /** Карточка в ленте суперсета: «A1 из 2» */
  label?: string;
};

// Текущее упражнение: название, ⚠️ при ограничении, план, прошлый результат, «Техника» и «Заменить».
// Три блока отдельно, как во фронте: расстояние между ними задаёт экран (gap-6), а в суперсете — карточка
export const ExerciseCard = ({ item, label }: ExerciseCardProps) => {
  const last = lastText(item.last, item.measure);
  // Аналоги и замена — только с сервера: без сети ссылка гасится, чтобы не вести на вечную загрузку
  const online = useIsOnline();
  // Над текущим упражнением подписи нет: и так понятно, что оно сейчас на экране
  const eyebrow = [item.done ? 'Сделано' : item.replaced ? 'Замена на сегодня' : null, label, item.draft && 'не проверено']
    .filter(Boolean)
    .join(' · ');
  const replaceHref = { pathname: ROUTES.WORKOUT_REPLACE, params: { itemId: String(item.id) } };

  return (
    <>
      <Rise>
        {eyebrow ? (
          <Eyebrow tone="primary" className="mb-3">
            {eyebrow}
          </Eyebrow>
        ) : null}
        <Poster size="2xl">{item.name}</Poster>

        {item.limitedZones.length > 0 && (
          <ButtonLink
            href={replaceHref}
            variant="alert"
            size="xs"
            className="mt-4"
            // Подпись в две строки: рамка растёт по тексту, а не режет его
            contentClassName="min-h-0 py-1.5"
            disabled={!online}
          >
            <Icon as={TriangleAlert} className="size-3.5" />
            {`нагружает ${item.limitedZones.join(', ')} — ${online ? 'заменить?' : 'заменить можно при сети'}`}
          </ButtonLink>
        )}
      </Rise>

      {/* Справка мелко: план и прошлый раз не спорят с подходами за внимание. Каждое своей строкой */}
      <Rise className="gap-1">
        <Text size="sm">
          <Eyebrow>План </Eyebrow>
          <Poster size="sm">{planText(item.plannedSets, item.repsMin, item.repsMax, item.measure)}</Poster>
        </Text>
        {/* Упражнение раньше не делали — сравнивать не с чем, строку не показываем */}
        {last ? (
          <Text size="sm">
            <Eyebrow>Прошлый раз </Eyebrow>
            <Poster size="sm" tone="primary">
              {last}
            </Poster>
          </Text>
        ) : null}
      </Rise>

      <Rise>
        <View className="flex-row gap-3">
          <ButtonLink
            // from=workout прячет «В тренировку»: менять программу посреди подхода незачем
            href={{ pathname: ROUTES.EXERCISE, params: { exerciseId: String(item.exerciseId), from: 'workout' } }}
            variant="outline"
            size="sm"
          >
            <Icon as={BookOpen} className="size-3.5" />
            Техника
          </ButtonLink>
          <ButtonLink href={replaceHref} variant="outline" size="sm" disabled={!online}>
            <Icon as={Repeat2} className="size-3.5" />
            {online ? 'Заменить' : 'Нужна сеть'}
          </ButtonLink>
        </View>
      </Rise>
    </>
  );
};

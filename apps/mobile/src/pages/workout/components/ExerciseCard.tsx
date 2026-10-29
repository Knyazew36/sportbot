import { useState } from 'react';
import { View } from 'react-native';
import { BookOpen, ChevronRight, Repeat2, TriangleAlert } from 'lucide-react-native';

import {
  historyUnit,
  lastText,
  planText,
  restText,
  typicalRest,
  type WorkoutItem,
} from '@sportbot/api/entities/workout';
import { ROUTES } from '@/shared/config/routes';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Icon } from '@/shared/ui/kit/Icon';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';
import { ExerciseHistorySheet } from '@/widgets/exercise-history/ExerciseHistorySheet';

type ExerciseCardProps = {
  item: WorkoutItem;
  /** Карточка в ленте суперсета: «A1 из 2» */
  label?: string;
};

// Текущее упражнение: название, ⚠️ при ограничении, план, прошлый результат, «Техника» и «Заменить».
// Три блока отдельно, как во фронте: расстояние между ними задаёт экран (gap-6), а в суперсете — карточка
export const ExerciseCard = ({ item, label }: ExerciseCardProps) => {
  const last = lastText(item.last, item.measure);
  const rest = item.last && typicalRest(item.last.sets);
  const [history, setHistory] = useState(false);
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
          >
            <Icon as={TriangleAlert} className="size-3.5" />
            {`нагружает ${item.limitedZones.join(', ')} — заменить?`}
          </ButtonLink>
        )}
      </Rise>

      {/* Справка мелко: план и прошлый раз не спорят с подходами за внимание. Каждое своей строкой.
          Метка и значение — соседи в View, а не вложенные Text: во вложенном Android берёт межстрочный
          строки и срезает высокие выносные Oswald. По той же причине leading значения — родная высота шрифта */}
      <Rise className="gap-1">
        <View className="flex-row items-baseline gap-1.5">
          <Eyebrow>План</Eyebrow>
          <Poster size="sm" className="shrink leading-[30px]">
            {planText(item.plannedSets, item.repsMin, item.repsMax, item.measure)}
          </Poster>
        </View>
        {/* Упражнение раньше не делали — сравнивать не с чем, строку не показываем.
            Строка — кнопка: по ней вся история упражнения с отдыхом, не уходя с тренировки */}
        {last && item.last ? (
          <Button
            variant="outline"
            size="sm"
            block
            spread
            className="mt-2"
            contentClassName="py-2"
            iconRight={ChevronRight}
            onPress={() => setHistory(true)}
          >
            <View className="min-w-0 shrink gap-0.5">
              <View className="flex-row items-baseline gap-1.5">
                <Eyebrow>Прошлый раз</Eyebrow>
                <Poster size="sm" tone="primary" className="shrink text-left leading-[30px]">
                  {last}
                </Poster>
              </View>
              <Text size="xs" tone="muted" className="text-left tabular-nums">
                {formatDate(item.last.date, 'd MMMM')}
                {rest != null ? ` · отдых ≈ ${restText(rest)}` : ''}
              </Text>
            </View>
          </Button>
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
          <ButtonLink href={replaceHref} variant="outline" size="sm">
            <Icon as={Repeat2} className="size-3.5" />
            Заменить
          </ButtonLink>
        </View>
      </Rise>

      <ExerciseHistorySheet
        exercise={history ? { id: item.exerciseId, name: item.name } : null}
        unit={historyUnit(item)}
        onOpenChange={setHistory}
      />
    </>
  );
};

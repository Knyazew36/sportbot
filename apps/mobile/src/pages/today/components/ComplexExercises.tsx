import { useState } from 'react';
import { View } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import type { DayToday } from '@sportbot/api/entities/day';
import { planText } from '@sportbot/api/entities/program';

import { ROUTES } from '@/shared/config/routes';
import { EXERCISE_FORMS } from '@/shared/lib/plural-forms';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Icon } from '@/shared/ui/kit/Icon';
import { ExerciseBlocks } from '@/shared/ui/kit/ExerciseBlocks';
import { List, ListRow } from '@/shared/ui/kit/ListRow';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Poster, Text } from '@/shared/ui/kit/Typography';
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet';

type Complex = NonNullable<DayToday['complex']>;

// Состав комплекса с планом подходов — порт ComplexExercises.tsx.
// Упражнение на зону с ограничением помечено ⚠️ (business-tz, 11)
export const ComplexExercises = ({ complex }: { complex: Complex }) => {
  const [opened, setOpened] = useState<{ id: number; name: string } | null>(null);

  return (
    <ScreenSection title="Состав" aside={pluralize(complex.exercises.length, EXERCISE_FORMS)}>
      {complex.exercises.length === 0 ? (
        <Text tone="soft">В тренировке пока нет упражнений — добавь их в программе.</Text>
      ) : (
        <List>
          {complex.warmupMinutes ? (
            // Перед упражнением 01 — нулевым номером
            <ListRow lead="00" title="Разминка" trail={<Poster numberOfLines={1}>{`${complex.warmupMinutes} мин`}</Poster>} />
          ) : null}
          <ExerciseBlocks items={complex.exercises}>
            {(e, i, label, last) => (
              // Вся строка открывает карточку упражнения. В суперсете строка внутри корешка — без выноса за поля
              <ListRow
                key={e.id}
                last={last}
                className={label ? undefined : '-mx-gutter px-gutter'}
                lead={label ?? String(i + 1).padStart(2, '0')}
                title={e.name}
                meta={e.muscles || undefined}
                onPress={() => setOpened({ id: e.exerciseId, name: e.name })}
                trail={<Poster numberOfLines={1}>{planText(e.sets, e.repsMin, e.repsMax, e.measure)}</Poster>}
              >
                {e.limitedZones.length > 0 && (
                  <View className="mt-2 flex-row items-center gap-1.5">
                    <Icon as={TriangleAlert} className="text-primary size-3.5" />
                    <Text size="xs" tone="primary" className="flex-1">
                      нагружает {e.limitedZones.join(', ')} — заменить можно на тренировке
                    </Text>
                  </View>
                )}
              </ListRow>
            )}
          </ExerciseBlocks>
          {complex.cardioName ? (
            <ListRow
              lead="+"
              title={complex.cardioName}
              meta="кардио"
              trail={
                complex.cardioMinutes ? <Poster numberOfLines={1}>{`${complex.cardioMinutes} мин`}</Poster> : undefined
              }
            />
          ) : null}
        </List>
      )}

      <ExerciseSheet
        exercise={opened}
        onOpenChange={(open) => !open && setOpened(null)}
        action={
          opened && (
            <ButtonLink
              href={{ pathname: ROUTES.EXERCISE, params: { exerciseId: String(opened.id) } }}
              variant="outline"
              size="lg"
              block
              onNavigate={() => setOpened(null)}
            >
              Подробнее в справочнике
            </ButtonLink>
          )
        }
      />
    </ScreenSection>
  );
};

import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PencilLine, Plus } from 'lucide-react-native';

import { EQUIPMENT_LABEL, exerciseGuide } from '@sportbot/api/entities/catalog';
import { useCatalogExercise } from '@/shared/local/entities/catalog';
import { complexLetter } from '@sportbot/api/entities/program';
import { useAddComplexExercises, useActiveProgram } from '@/shared/local/entities/program';

import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { AddToComplexSheet } from '@/widgets/catalog/AddToComplexSheet';
import { ExerciseEditSheet } from '@/widgets/catalog/ExerciseEditSheet';
import { CatalogGuide } from '@/widgets/catalog-guide/CatalogGuide';

import { ExerciseHero } from './components/ExerciseHero';
import { ExerciseMuscles } from './components/ExerciseMuscles';

// Карточка упражнения (frontend-tz, 11.2) — порт pages/exercise/ExercisePage.tsx.
// Открывается из справочника, шторки «Сегодня» и кнопкой «Техника» на тренировке (from=workout).
// «Назад» — системный: возвращает туда, откуда пришли. Плашки для своего видео нет: видеоредактор в мобилку не ставим
const ExercisePage = () => {
  const params = useLocalSearchParams<{ exerciseId: string; from?: string }>();
  // С тренировки пришли посмотреть технику — менять программу посреди подхода незачем
  const fromWorkout = params.from === 'workout';
  const exercise = useCatalogExercise(Number(params.exerciseId));
  const program = useActiveProgram();
  const add = useAddComplexExercises();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <Screen
      header={
        <TopBar
          title={exercise.data?.name ?? 'Упражнение'}
          subtitle={exercise.data?.equipment ? EQUIPMENT_LABEL[exercise.data.equipment] : undefined}
        />
      }
      footer={
        <StickyFooter>
          <Button
            variant="outline"
            size="icon-lg"
            contentClassName="size-[60px]"
            disabled={!exercise.data}
            accessibilityLabel="Предложить правку"
            onPress={() => setEditOpen(true)}
          >
            <Icon as={PencilLine} className="size-6" />
          </Button>
          {!fromWorkout && (
            <Button
              size="lg"
              icon={Plus}
              disabled={!exercise.data || !program.data}
              onPress={() => setAddOpen(true)}
              className="flex-1"
            >
              {program.data ? 'В тренировку' : 'Нет активной программы'}
            </Button>
          )}
        </StickyFooter>
      }
      className="gap-7"
    >
      <QueryState query={exercise}>
        {(e) => (
          <>
            <ExerciseHero exercise={e} />
            <ExerciseMuscles exercise={e} />
            <CatalogGuide guide={exerciseGuide(e)} title="Техника" />

            {program.data && !fromWorkout && (
              <AddToComplexSheet
                open={addOpen}
                onOpenChange={setAddOpen}
                program={program.data.name}
                complexes={program.data.complexes.map((c, i) => ({
                  id: c.id,
                  letter: complexLetter(i),
                  title: c.name,
                  count: c.exercises.length,
                }))}
                onPick={(complexId) => add.mutateAsync({ complexId, exerciseIds: [e.id] })}
              />
            )}
            <ExerciseEditSheet open={editOpen} onOpenChange={setEditOpen} exercise={e} />
          </>
        )}
      </QueryState>
    </Screen>
  );
};

export default ExercisePage;

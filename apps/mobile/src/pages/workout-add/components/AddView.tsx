import type { Workout } from '@sportbot/api/entities/workout';
import { ExercisePicker } from '@/widgets/program-editor/ExercisePicker';

import { useAddFlow } from '../model/use-add-flow';
import { AddPlaceSheet } from './AddPlaceSheet';

// Силы остались — ещё упражнения в идущую тренировку. Добавлять можно только до «Завершить»:
// завершение двигает очередь программы и собирает заминку по мышцам тренировки
export const AddView = ({ workout }: { workout: Workout }) => {
  const flow = useAddFlow(workout);
  return (
    <>
      <ExercisePicker
        presentIds={workout.exercises.map((e) => e.exerciseId)}
        subtitle="в сегодняшнюю тренировку"
        adding={flow.pending}
        onAdd={flow.setPicked}
      />
      <AddPlaceSheet
        open={flow.picked !== null}
        onClose={() => flow.setPicked(null)}
        complexName={workout.complexId ? (workout.complexName ?? '') : null}
        pending={flow.pending}
        onApply={flow.apply}
      />
    </>
  );
};

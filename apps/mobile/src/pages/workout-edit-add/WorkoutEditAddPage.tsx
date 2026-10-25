import { router, useLocalSearchParams } from 'expo-router';

import { useAddItems, useWorkout } from '@sportbot/api/entities/workout';
import { ExercisePicker } from '@/widgets/program-editor/ExercisePicker';

// Забытое упражнение в прошедшую тренировку из статистики. Только в неё: комплекс правят в программе.
// Подходы к нему дописывают на экране правки — он лежит под подбором в стеке, туда и возвращаемся
const WorkoutEditAddPage = () => {
  const { workoutId: param } = useLocalSearchParams<{ workoutId: string }>();
  const workoutId = Number(param);
  const workout = useWorkout(workoutId);
  const add = useAddItems();

  return (
    <ExercisePicker
      presentIds={workout.data?.exercises.map((e) => e.exerciseId) ?? []}
      subtitle={workout.data?.complexName ? `в «${workout.data.complexName}»` : 'в прошедшую тренировку'}
      adding={add.isPending}
      onAdd={(exerciseIds) =>
        void add.mutateAsync({ workoutId, exerciseIds, inComplex: false }).then(() => router.back())
      }
    />
  );
};

export default WorkoutEditAddPage;

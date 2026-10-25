import { router, useLocalSearchParams } from 'expo-router';

import {
  pickerSubtitle,
  supersetTargetFromParams,
  useAddComplexExercises,
  useProgram,
} from '@sportbot/api/entities/program';

import { ExercisePicker } from '@/widgets/program-editor/ExercisePicker';

// Подбор упражнений в комплекс программы пользователя (frontend-tz, 10.3).
// Цель-суперсет приходит параметрами адреса (withSupersetTarget), как во фронте
const AddExercisePage = () => {
  const { programId: programParam, complexId: complexParam, ...search } = useLocalSearchParams<{
    programId: string;
    complexId: string;
    join?: string;
    superset?: string;
  }>();
  const programId = Number(programParam);
  const complexId = Number(complexParam);
  const target = supersetTargetFromParams(new URLSearchParams(search as Record<string, string>));
  const program = useProgram(programId);
  const add = useAddComplexExercises();
  const complex = program.data?.complexes.find((c) => c.id === complexId);

  return (
    <ExercisePicker
      presentIds={complex?.exercises.map((e) => e.exerciseId) ?? []}
      subtitle={pickerSubtitle(complex, target)}
      target={target}
      adding={add.isPending}
      // Экран тренировки лежит под подбором в стеке — туда и возвращаемся
      onAdd={(exerciseIds) => add.mutate({ complexId, exerciseIds, ...target }, { onSuccess: () => router.back() })}
    />
  );
};

export default AddExercisePage;

import { useQueryClient } from '@tanstack/react-query';

import { type Program, programKeys } from '@sportbot/api/entities/program';
import { useDeleteComplex, useDeleteComplexExercise, useRenameComplex, useReorderComplexExercises, useSetComplexWarmup, useUngroupComplexExercise, useUngroupSuperset, useUpdateComplexExercise } from '@/shared/local/entities/program';

import { useComplexEditing } from '@/widgets/program-editor/use-complex-editing';

// Правки уходят на сервер по очереди; удаление упражнения и разборку суперсета можно отменить 3 секунды
export const useComplexActions = (programId: number, complexId: number, onDeleted: () => void) => {
  const queryClient = useQueryClient();
  const renameComplex = useRenameComplex();
  const setWarmup = useSetComplexWarmup();
  const deleteComplex = useDeleteComplex();
  const updateExercise = useUpdateComplexExercise();
  const deleteExercise = useDeleteComplexExercise();
  const reorderExercises = useReorderComplexExercises();
  const ungroupExercise = useUngroupComplexExercise();
  const ungroupSuperset = useUngroupSuperset();

  return useComplexEditing({
    mutations: {
      renameComplex: (id, name) => renameComplex.mutateAsync({ id, name }),
      setWarmup: (id, warmupMinutes) => setWarmup.mutateAsync({ id, warmupMinutes }),
      deleteComplex: (id) => deleteComplex.mutateAsync(id),
      updateExercise: (id, plan) => updateExercise.mutateAsync({ id, ...plan }),
      deleteExercise: (id) => deleteExercise.mutateAsync(id),
      reorderExercises: (id, ids) => reorderExercises.mutateAsync({ complexId: id, ids }),
      ungroupExercise: (id) => ungroupExercise.mutateAsync(id),
      ungroupSuperset: (id, superset) => ungroupSuperset.mutateAsync({ complexId: id, superset }),
    },
    readComplex: () =>
      queryClient.getQueryData<Program>(programKeys.detail(programId))?.complexes.find((c) => c.id === complexId),
    onDeleted,
  });
};

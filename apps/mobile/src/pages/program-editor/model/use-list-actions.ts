import { type Program } from '@sportbot/api/entities/program';
import { useAddComplex, useReorderComplexes } from '@/shared/local/entities/program';

import { arrangeBy } from '@/widgets/program-editor/arrange';
import type { ComplexListActions } from '@/widgets/program-editor/ProgramComplexList';

// Каждая правка сразу уходит на сервер; пока перестановка сохраняется, показываем новый порядок, а не старый
export const useListActions = (programId: number) => {
  const addComplex = useAddComplex();
  const reorderComplexes = useReorderComplexes();

  const actions: ComplexListActions = {
    addComplex: (name) => addComplex.mutateAsync({ programId, name }),
    reorderComplexes: (ids) => reorderComplexes.mutate({ programId, ids }),
  };

  const arrange = (program: Program) =>
    arrangeBy(program.complexes, reorderComplexes.isPending ? reorderComplexes.variables.ids : undefined);

  return { actions, arrange, adding: addComplex.isPending };
};

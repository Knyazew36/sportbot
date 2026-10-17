import { Prisma } from '@/generated/prisma/client';

import { ProgramComplexResponseDto } from './dto/program-complex.response.dto';

/** Состав программы: комплексы и упражнения по порядку. Нужен и экрану программы, и профилю друга. */
export const COMPLEXES_INCLUDE = {
  orderBy: { position: 'asc' },
  include: {
    exercises: {
      orderBy: { position: 'asc' },
      include: {
        exercise: { include: { muscles: { include: { muscle: true } } } },
      },
    },
  },
} satisfies Prisma.Program$complexesArgs;

type ComplexView = Prisma.ComplexGetPayload<{
  include: typeof COMPLEXES_INCLUDE.include;
}>;

export const toComplexesDto = (
  complexes: ComplexView[],
  nextComplexId: number | null,
): ProgramComplexResponseDto[] =>
  complexes.map((c) => ({
    id: c.id,
    name: c.name,
    position: c.position,
    cardioName: c.cardioName,
    cardioMinutes: c.cardioMinutes,
    isNext: c.id === nextComplexId,
    exercises: c.exercises.map((item) => ({
      id: item.id,
      exerciseId: item.exerciseId,
      name: item.exercise.name,
      muscles: item.exercise.muscles
        .filter((m) => m.role === 'PRIMARY')
        .map((m) => m.muscle.name)
        .join(' · '),
      draft: item.exercise.status === 'DRAFT',
      sets: item.sets,
      repsMin: item.repsMin,
      repsMax: item.repsMax,
      measure: item.exercise.measure,
      superset: item.superset,
    })),
  }));

import { Prisma } from '@/generated/prisma/client';

/** Источник копии — сколько нужно, чтобы понять, чья это копия и обновился ли он. */
export const SOURCE_PROGRAM_SELECT = {
  select: {
    isTemplate: true,
    isPublished: true,
    contentUpdatedAt: true,
    owner: { select: { sportProfile: { select: { displayName: true } } } },
  },
} satisfies Prisma.ProgramDefaultArgs;

export type WithSource = {
  sourceProgram: Prisma.ProgramGetPayload<typeof SOURCE_PROGRAM_SELECT> | null;
  sourceSyncedAt: Date | null;
  sourceDismissedAt: Date | null;
};

/** Имя друга, с чьей программы снята копия; копия шаблона — не от друга. */
export const friendName = (program: WithSource): string | null =>
  program.sourceProgram && !program.sourceProgram.isTemplate
    ? (program.sourceProgram.owner?.sportProfile?.displayName ?? 'друга')
    : null;

export const fromTemplate = (program: WithSource): boolean =>
  !!program.sourceProgram?.isTemplate;

/**
 * Друг или админ поменял источник после копирования (business-tz, 10.1). «Не сейчас» прячет
 * плашку до следующей правки источника.
 */
export const sourceUpdated = (program: WithSource): boolean => {
  const source = program.sourceProgram;
  if (!source || !program.sourceSyncedAt) return false;
  // Снятый с публикации шаблон админ, скорее всего, ещё правит — не зовём обновляться
  if (source.isTemplate && !source.isPublished) return false;
  const seen =
    program.sourceDismissedAt &&
    program.sourceDismissedAt > program.sourceSyncedAt
      ? program.sourceDismissedAt
      : program.sourceSyncedAt;
  return source.contentUpdatedAt > seen;
};

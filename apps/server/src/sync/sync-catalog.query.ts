import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from 'prisma/prisma.service';

import { imageCredit } from '@/catalog/dto/image-credit.response.dto';
import {
  PROGRAM_INCLUDE,
  PUBLISHED_TEMPLATE,
  TEMPLATE_ORDER,
} from '@/program/program.service';
import {
  PROGRAM_TAG_ORDER,
  PROGRAM_TAG_SELECT,
} from '@/program-tag/program-tag.service';

import { SyncCatalogResponseDto } from './dto/sync-catalog.response.dto';
import { PULL_OVERLAP_MS } from './sync.constants';
import { timeOf } from './sync-format';

type SyncCatalogScope = {
  visibleExercises: Prisma.ExerciseWhereInput;
  visibleStretches: Prisma.StretchWhereInput;
  since?: string;
  /** Путь загрузки → публичный url (UploadService.toPublicUrl) */
  toUrl: (path: string | null) => string | null;
};

/**
 * Ответ sync/catalog. Вне сервиса — потому что тем же ответом собирается снимок справочника
 * для сборки мобилки (prisma/export-mobile-seed.ts): формы не должны разойтись
 */
export const loadSyncCatalog = async (
  prisma: PrismaService,
  { visibleExercises, visibleStretches, since, toUrl }: SyncCatalogScope,
): Promise<SyncCatalogResponseDto> => {
  const startedAt = Date.now();
  const changed = since ? { updatedAt: { gt: new Date(since) } } : {};

  const [
    muscles,
    joints,
    tagGroups,
    tags,
    exercises,
    stretches,
    exerciseIds,
    stretchIds,
    templates,
  ] = await Promise.all([
    prisma.muscle.findMany({ orderBy: { bodyOrder: 'asc' } }),
    prisma.joint.findMany({ orderBy: { id: 'asc' } }),
    prisma.programTagGroup.findMany({ orderBy: { position: 'asc' } }),
    prisma.programTag.findMany({
      where: { isApproved: true },
      orderBy: [{ groupId: 'asc' }, { position: 'asc' }],
    }),
    prisma.exercise.findMany({
      where: { AND: [visibleExercises, changed] },
      include: { muscles: true, joints: true },
    }),
    prisma.stretch.findMany({
      where: { AND: [visibleStretches, changed] },
      include: { muscles: true },
    }),
    prisma.exercise.findMany({ where: visibleExercises, select: { id: true } }),
    prisma.stretch.findMany({ where: visibleStretches, select: { id: true } }),
    prisma.program.findMany({
      where: PUBLISHED_TEMPLATE,
      orderBy: TEMPLATE_ORDER,
      include: {
        ...PROGRAM_INCLUDE,
        tags: { orderBy: PROGRAM_TAG_ORDER, select: PROGRAM_TAG_SELECT },
      },
    }),
  ]);

  return {
    cursor: new Date(startedAt - PULL_OVERLAP_MS).toISOString(),
    muscles: muscles.map((m) => ({
      id: m.id,
      code: m.code,
      name: m.name,
      bodyOrder: m.bodyOrder,
    })),
    joints: joints.map((j) => ({ id: j.id, code: j.code, name: j.name })),
    tagGroups: tagGroups.map((g) => ({
      id: g.id,
      code: g.code,
      name: g.name,
      position: g.position,
    })),
    tags: tags.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      position: t.position,
      groupId: t.groupId,
    })),
    exercises: exercises.map((e) => ({
      id: e.id,
      name: e.name,
      nameNormalized: e.nameNormalized,
      technique: e.technique,
      steps: e.steps,
      mistakes: e.mistakes,
      imageUrl: toUrl(e.imagePath),
      imageEndUrl: toUrl(e.imageEndPath),
      imageCredit: imageCredit(e),
      videoUrl: e.videoUrl,
      equipment: e.equipment,
      measure: e.measure,
      draft: e.status === 'DRAFT',
      muscles: e.muscles.map((m) => ({ muscleId: m.muscleId, role: m.role })),
      jointIds: e.joints.map((j) => j.jointId),
      updatedAt: timeOf(e.updatedAt),
    })),
    stretches: stretches.map((s) => ({
      id: s.id,
      name: s.name,
      nameNormalized: s.nameNormalized,
      howTo: s.howTo,
      steps: s.steps,
      mistakes: s.mistakes,
      imageUrl: toUrl(s.imagePath),
      imageEndUrl: toUrl(s.imageEndPath),
      imageCredit: imageCredit(s),
      videoUrl: s.videoUrl,
      feel: s.feel,
      position: s.position,
      holdSeconds: s.holdSeconds,
      perSide: s.perSide,
      kind: s.kind,
      draft: s.status === 'DRAFT',
      muscleIds: s.muscles.map((m) => m.muscleId),
      updatedAt: timeOf(s.updatedAt),
    })),
    templates: templates.map((p) => ({
      id: p.id,
      name: p.publishedName ?? p.name,
      position: p.position,
      contentUpdatedAt: timeOf(p.contentUpdatedAt),
      tags: p.tags,
      complexes: p.complexes.map((c) => ({
        id: c.id,
        name: c.name,
        position: c.position,
        cardioName: c.cardioName,
        cardioMinutes: c.cardioMinutes,
        warmupMinutes: c.warmupMinutes,
        exercises: c.exercises.map((item) => ({
          id: item.id,
          exerciseId: item.exerciseId,
          position: item.position,
          sets: item.sets,
          repsMin: item.repsMin,
          repsMax: item.repsMax,
          superset: item.superset,
        })),
      })),
    })),
    exerciseIds: exerciseIds.map((e) => e.id),
    stretchIds: stretchIds.map((s) => s.id),
  };
};

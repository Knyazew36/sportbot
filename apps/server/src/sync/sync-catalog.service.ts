import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { CatalogService } from '@/catalog/catalog.service';
import { imageCredit } from '@/catalog/dto/image-credit.response.dto';
import { UploadService } from '@/upload/upload.service';

import { SyncCatalogResponseDto } from './dto/sync-catalog.response.dto';
import { PULL_OVERLAP_MS } from './sync.constants';
import { timeOf } from './sync-format';

@Injectable()
export class SyncCatalogService {
  private readonly logger = new Logger(`🔄 ${SyncCatalogService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
    private readonly uploads: UploadService,
  ) {}

  /** Справочник для офлайна: мелкие таблицы целиком, упражнения и растяжки — изменённые с since. */
  public async catalogOf(
    userId: number,
    since?: string,
  ): Promise<SyncCatalogResponseDto> {
    const startedAt = Date.now();
    const changed = since ? { updatedAt: { gt: new Date(since) } } : {};
    const visibleExercises = this.catalog.visibleExercises(userId);
    const visibleStretches = this.catalog.visibleStretches(userId);

    const [
      muscles,
      joints,
      tagGroups,
      tags,
      exercises,
      stretches,
      exerciseIds,
      stretchIds,
    ] = await Promise.all([
      this.prisma.muscle.findMany({ orderBy: { bodyOrder: 'asc' } }),
      this.prisma.joint.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.programTagGroup.findMany({ orderBy: { position: 'asc' } }),
      this.prisma.programTag.findMany({
        where: { isApproved: true },
        orderBy: [{ groupId: 'asc' }, { position: 'asc' }],
      }),
      this.prisma.exercise.findMany({
        where: { AND: [visibleExercises, changed] },
        include: { muscles: true, joints: true },
      }),
      this.prisma.stretch.findMany({
        where: { AND: [visibleStretches, changed] },
        include: { muscles: true },
      }),
      this.prisma.exercise.findMany({
        where: visibleExercises,
        select: { id: true },
      }),
      this.prisma.stretch.findMany({
        where: visibleStretches,
        select: { id: true },
      }),
    ]);

    this.logger.log(
      `Справочник: userId=${userId}, since=${since ?? '—'}, упражнений=${exercises.length}/${exerciseIds.length}, растяжек=${stretches.length}/${stretchIds.length}, ${Date.now() - startedAt} мс`,
    );

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
        imageUrl: this.uploads.toPublicUrl(e.imagePath),
        imageEndUrl: this.uploads.toPublicUrl(e.imageEndPath),
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
        imageUrl: this.uploads.toPublicUrl(s.imagePath),
        imageEndUrl: this.uploads.toPublicUrl(s.imageEndPath),
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
      exerciseIds: exerciseIds.map((e) => e.id),
      stretchIds: stretchIds.map((s) => s.id),
    };
  }
}

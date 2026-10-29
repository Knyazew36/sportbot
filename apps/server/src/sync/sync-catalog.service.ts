import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { CatalogService } from '@/catalog/catalog.service';
import { UploadService } from '@/upload/upload.service';

import { SyncCatalogResponseDto } from './dto/sync-catalog.response.dto';
import { loadSyncCatalog } from './sync-catalog.query';

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
    const res = await loadSyncCatalog(this.prisma, {
      visibleExercises: this.catalog.visibleExercises(userId),
      visibleStretches: this.catalog.visibleStretches(userId),
      since,
      toUrl: (path) => this.uploads.toPublicUrl(path),
    });

    this.logger.log(
      `Справочник: userId=${userId}, since=${since ?? '—'}, упражнений=${res.exercises.length}/${res.exerciseIds.length}, растяжек=${res.stretches.length}/${res.stretchIds.length}, ${Date.now() - startedAt} мс`,
    );
    return res;
  }
}

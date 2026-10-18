import { ApiPropertyOptional } from '@nestjs/swagger';
import { COMPOSITION_IDS, type CompositionId } from '@sportbot/render-contract';
import { IsIn, IsOptional } from 'class-validator';

export class ListRenderJobsQueryDto {
  @ApiPropertyOptional({
    enum: COMPOSITION_IDS,
    example: 'lower-third',
    description: 'Только этот ролик; без него — файлы всех роликов',
  })
  @IsOptional()
  @IsIn(COMPOSITION_IDS, { message: 'Неизвестный ролик' })
  compositionId?: CompositionId;
}

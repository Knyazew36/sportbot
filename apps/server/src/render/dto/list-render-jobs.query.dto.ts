import { ApiProperty } from '@nestjs/swagger';
import { COMPOSITION_IDS, type CompositionId } from '@sportbot/render-contract';
import { IsIn } from 'class-validator';

export class ListRenderJobsQueryDto {
  @ApiProperty({ enum: COMPOSITION_IDS, example: 'lower-third' })
  @IsIn(COMPOSITION_IDS, { message: 'Неизвестный ролик' })
  compositionId: CompositionId;
}

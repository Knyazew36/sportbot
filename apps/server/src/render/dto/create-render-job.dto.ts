import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  COMPOSITION_IDS,
  COMPOSITIONS,
  RENDER_DELIVERIES,
  RENDER_FORMAT_IDS,
  type CompositionId,
  type RenderDelivery,
  type RenderFormat,
} from '@sportbot/render-contract';
import { IsIn, IsObject, IsOptional } from 'class-validator';

export class CreateRenderJobDto {
  @ApiProperty({ enum: COMPOSITION_IDS, example: 'lower-third' })
  @IsIn(COMPOSITION_IDS, { message: 'Неизвестный ролик' })
  compositionId: CompositionId;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      'Props композиции — схема в @sportbot/render-contract (COMPOSITIONS[id].schema)',
    example: COMPOSITIONS['lower-third'].example,
  })
  @IsObject({ message: 'props — объект' })
  props: Record<string, unknown>;

  @ApiPropertyOptional({
    enum: RENDER_FORMAT_IDS,
    description: 'Не задан — первый формат композиции',
  })
  @IsOptional()
  @IsIn(RENDER_FORMAT_IDS, { message: 'Неизвестный формат' })
  format?: RenderFormat;

  @ApiProperty({ enum: RENDER_DELIVERIES })
  @IsIn(RENDER_DELIVERIES, { message: 'Неизвестный способ доставки' })
  delivery: RenderDelivery;
}

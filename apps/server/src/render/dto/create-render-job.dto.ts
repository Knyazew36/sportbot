import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  COMPOSITION_IDS,
  COMPOSITIONS,
  RENDER_FORMAT_IDS,
  type CompositionId,
  type RenderFormat,
} from '@sportbot/render-contract';
import { IsBoolean, IsIn, IsObject, IsOptional } from 'class-validator';

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
    description: 'Не задан — первый из общих форматов',
  })
  @IsOptional()
  @IsIn(RENDER_FORMAT_IDS, { message: 'Неизвестный формат' })
  format?: RenderFormat;

  @ApiPropertyOptional({
    description:
      'Прислать файл ботом в чат: готов — сразу, в работе — как только будет готов',
  })
  @IsOptional()
  @IsBoolean()
  toChat?: boolean;
}

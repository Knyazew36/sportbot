import { ApiProperty } from '@nestjs/swagger';

import { CatalogRefResponseDto } from './catalog-ref.response.dto';

export class CatalogStretchResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, nullable: true })
  imageUrl: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Общее описание' })
  howTo: string | null;

  @ApiProperty({ type: [String], description: 'Шаги выполнения по порядку' })
  steps: string[];

  @ApiProperty({
    type: [String],
    description: 'Типичные ошибки, каждая с исправлением',
  })
  mistakes: string[];

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Фото финишного положения',
  })
  imageEndUrl: string | null;

  @ApiProperty({ description: 'Удержание, с' })
  holdSeconds: number;

  @ApiProperty({ description: 'На каждую сторону' })
  perSide: boolean;

  @ApiProperty({ type: [CatalogRefResponseDto] })
  muscles: CatalogRefResponseDto[];

  @ApiProperty({ description: 'Личный черновик — «не проверено»' })
  draft: boolean;

  @ApiProperty({ description: 'Своя запись автора (не копия чужой)' })
  mine: boolean;

  @ApiProperty({ description: 'Ждёт проверки администратора' })
  pendingReview: boolean;

  @ApiProperty({ description: 'Можно отправить на проверку в общий справочник' })
  canPublish: boolean;
}

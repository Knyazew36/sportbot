import { ApiProperty } from '@nestjs/swagger';

import { CatalogRefResponseDto } from './catalog-ref.response.dto';

export class CatalogExerciseResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, nullable: true })
  imageUrl: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Ключевые пункты и типичные ошибки',
  })
  technique: string | null;

  @ApiProperty({ type: String, nullable: true })
  videoUrl: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    enum: ['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT'],
  })
  equipment: 'BARBELL' | 'DUMBBELL' | 'MACHINE' | 'BODYWEIGHT' | null;

  @ApiProperty({ type: [CatalogRefResponseDto] })
  primaryMuscles: CatalogRefResponseDto[];

  @ApiProperty({ type: [CatalogRefResponseDto] })
  secondaryMuscles: CatalogRefResponseDto[];

  @ApiProperty({
    type: [CatalogRefResponseDto],
    description: 'Нагружаемые суставы',
  })
  joints: CatalogRefResponseDto[];

  @ApiProperty({ description: 'Личный черновик — «не проверено»' })
  draft: boolean;
}

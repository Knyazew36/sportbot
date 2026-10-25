import { ApiProperty } from '@nestjs/swagger';

import { CatalogRefResponseDto } from './catalog-ref.response.dto';
import { ImageCreditResponseDto } from './image-credit.response.dto';

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
    description: 'Общее описание техники',
  })
  technique: string | null;

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

  @ApiProperty({ type: ImageCreditResponseDto, nullable: true })
  imageCredit: ImageCreditResponseDto | null;

  @ApiProperty({ type: String, nullable: true })
  videoUrl: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    enum: ['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT'],
  })
  equipment: 'BARBELL' | 'DUMBBELL' | 'MACHINE' | 'BODYWEIGHT' | null;

  @ApiProperty({
    enum: ['REPS', 'TIME', 'MINUTES'],
    description: 'Чем меряется: повторы или время (кардио, удержания)',
  })
  measure: 'REPS' | 'TIME' | 'MINUTES';

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

  @ApiProperty({ description: 'Своя запись автора (не копия чужой)' })
  mine: boolean;

  @ApiProperty({ description: 'Ждёт проверки администратора' })
  pendingReview: boolean;

  @ApiProperty({ description: 'Можно отправить на проверку в общий справочник' })
  canPublish: boolean;
}

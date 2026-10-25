import { ApiProperty } from '@nestjs/swagger';

import { ImageCreditResponseDto } from '@/catalog/dto/image-credit.response.dto';

import { WorkoutLastResultResponseDto } from './workout-last-result.response.dto';
import { WorkoutSetResponseDto } from './workout-set.response.dto';

export class WorkoutItemResponseDto {
  @ApiProperty({ description: 'Упражнение тренировки (WorkoutExercise)' })
  id: number;

  @ApiProperty()
  exerciseId: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Основные мышцы через « · »' })
  muscles: string;

  @ApiProperty({ type: String, nullable: true, description: '/uploads/…' })
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
    description: 'Упражнение с собственным весом: вес необязателен',
  })
  bodyweight: boolean;

  @ApiProperty({ description: 'Личный черновик — «не проверено»' })
  draft: boolean;

  @ApiProperty({
    description: 'Сделано: есть подходы или нажато «Упражнение сделано»',
  })
  done: boolean;

  @ApiProperty({ description: 'Заменено на этой тренировке' })
  replaced: boolean;

  @ApiProperty()
  plannedSets: number;

  @ApiProperty()
  repsMin: number;

  @ApiProperty()
  repsMax: number;

  @ApiProperty({
    enum: ['REPS', 'TIME', 'MINUTES'],
    description: 'Чем меряется: TIME — в repsMin/repsMax секунды',
  })
  measure: 'REPS' | 'TIME' | 'MINUTES';

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Номер суперсета: участники идут подряд и делаются по кругу',
  })
  superset: number | null;

  @ApiProperty({
    type: [String],
    description: 'Зоны с активным ограничением, которые нагружает упражнение',
  })
  limitedZones: string[];

  @ApiProperty({ type: [WorkoutSetResponseDto] })
  sets: WorkoutSetResponseDto[];

  @ApiProperty({
    type: WorkoutLastResultResponseDto,
    nullable: true,
    description: 'Прошлый раз по этому упражнению; null — первый раз',
  })
  last: WorkoutLastResultResponseDto | null;
}

import { ApiProperty } from '@nestjs/swagger';

import { ImageCreditResponseDto } from '@/catalog/dto/image-credit.response.dto';
import {
  Equipment,
  ExerciseMeasure,
  MuscleRole,
  StretchKind,
  StretchPosition,
} from '@/generated/prisma/client';

const nullableStr = { type: String, nullable: true } as const;

export class SyncMuscleDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Порядок сверху вниз по телу' })
  bodyOrder: number;
}

export class SyncJointDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;
}

export class SyncTagDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  position: number;

  @ApiProperty()
  groupId: number;
}

export class SyncTagGroupDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  position: number;
}

export class SyncExerciseMuscleDto {
  @ApiProperty()
  muscleId: number;

  @ApiProperty({ enum: MuscleRole, enumName: 'MuscleRole' })
  role: MuscleRole;
}

export class SyncExerciseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Для поиска: нижний регистр, ё→е' })
  nameNormalized: string;

  @ApiProperty(nullableStr)
  technique: string | null;

  @ApiProperty({ type: [String] })
  steps: string[];

  @ApiProperty({ type: [String] })
  mistakes: string[];

  @ApiProperty(nullableStr)
  imageUrl: string | null;

  @ApiProperty(nullableStr)
  imageEndUrl: string | null;

  @ApiProperty({ type: ImageCreditResponseDto, nullable: true })
  imageCredit: ImageCreditResponseDto | null;

  @ApiProperty(nullableStr)
  videoUrl: string | null;

  @ApiProperty({ enum: Equipment, enumName: 'Equipment', nullable: true })
  equipment: Equipment | null;

  @ApiProperty({ enum: ExerciseMeasure, enumName: 'ExerciseMeasure' })
  measure: ExerciseMeasure;

  @ApiProperty({ description: 'Свой черновик — виден только автору' })
  draft: boolean;

  @ApiProperty({ type: [SyncExerciseMuscleDto] })
  muscles: SyncExerciseMuscleDto[];

  @ApiProperty({ type: [Number] })
  jointIds: number[];

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: string;
}

export class SyncStretchDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  nameNormalized: string;

  @ApiProperty(nullableStr)
  howTo: string | null;

  @ApiProperty({ type: [String] })
  steps: string[];

  @ApiProperty({ type: [String] })
  mistakes: string[];

  @ApiProperty(nullableStr)
  imageUrl: string | null;

  @ApiProperty(nullableStr)
  imageEndUrl: string | null;

  @ApiProperty({ type: ImageCreditResponseDto, nullable: true })
  imageCredit: ImageCreditResponseDto | null;

  @ApiProperty(nullableStr)
  videoUrl: string | null;

  @ApiProperty(nullableStr)
  feel: string | null;

  @ApiProperty({
    enum: StretchPosition,
    enumName: 'StretchPosition',
    nullable: true,
  })
  position: StretchPosition | null;

  @ApiProperty()
  holdSeconds: number;

  @ApiProperty()
  perSide: boolean;

  @ApiProperty({ enum: StretchKind, enumName: 'StretchKind' })
  kind: StretchKind;

  @ApiProperty()
  draft: boolean;

  @ApiProperty({ type: [Number] })
  muscleIds: number[];

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: string;
}

export class SyncCatalogResponseDto {
  @ApiProperty({ description: 'Передать в следующий запрос как since' })
  cursor: string;

  @ApiProperty({ type: [SyncMuscleDto], description: 'Всегда целиком' })
  muscles: SyncMuscleDto[];

  @ApiProperty({ type: [SyncJointDto], description: 'Всегда целиком' })
  joints: SyncJointDto[];

  @ApiProperty({ type: [SyncTagGroupDto], description: 'Всегда целиком' })
  tagGroups: SyncTagGroupDto[];

  @ApiProperty({
    type: [SyncTagDto],
    description: 'Одобренные теги, всегда целиком',
  })
  tags: SyncTagDto[];

  @ApiProperty({
    type: [SyncExerciseDto],
    description: 'Изменённые с since; без since — все видимые',
  })
  exercises: SyncExerciseDto[];

  @ApiProperty({ type: [SyncStretchDto] })
  stretches: SyncStretchDto[];

  @ApiProperty({
    type: [Number],
    description:
      'Id всех видимых упражнений: остальные клиент удаляет (снятые черновики, слитые дубли)',
  })
  exerciseIds: number[];

  @ApiProperty({ type: [Number] })
  stretchIds: number[];
}

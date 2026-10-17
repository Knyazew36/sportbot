import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

import { TextList } from '../text-list.decorator';

const EQUIPMENT = ['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT'] as const;

/**
 * Правка упражнения от пользователя: передаются только изменённые поля формы,
 * правила полей — как у формы админа (SaveExerciseDto).
 */
export class CreateExerciseProposalDto {
  @ApiProperty({ description: 'Упражнение, к которому правка' })
  @IsInt()
  exerciseId: number;

  @ApiPropertyOptional({ description: 'Что не так и почему так лучше' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500, { message: 'До 500 символов' })
  comment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(2, { message: 'Название — от 2 символов' })
  @MaxLength(60, { message: 'Название — до 60 символов' })
  name?: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Trim()
  @IsString()
  @MaxLength(2000, { message: 'До 2000 символов' })
  technique?: string | null;

  @TextList('Шаги выполнения по порядку')
  steps?: string[];

  @TextList('Типичные ошибки, каждая с исправлением')
  mistakes?: string[];

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsUrl({}, { message: 'Ссылка на видео — полный адрес https://…' })
  videoUrl?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, enum: EQUIPMENT })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsIn(EQUIPMENT)
  equipment?: (typeof EQUIPMENT)[number] | null;

  @ApiPropertyOptional({
    enum: ['REPS', 'TIME', 'MINUTES'],
    description: 'Чем меряется: повторы или время (кардио, удержания)',
  })
  @IsOptional()
  @IsIn(['REPS', 'TIME', 'MINUTES'])
  measure?: 'REPS' | 'TIME' | 'MINUTES';

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Из POST catalog/image; null — убрать картинку',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  // Только файл, загруженный через catalog/image: чужой путь в правку не подставить
  @Matches(/^catalog\/[\w-]+\.\w+$/, { message: 'Загрузи картинку заново' })
  imagePath?: string | null;

  @ApiPropertyOptional({ type: [Number], description: 'Основные мышцы' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Нужна хотя бы одна основная мышца' })
  @IsInt({ each: true })
  primary?: number[];

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  secondary?: number[];

  @ApiPropertyOptional({ type: [Number], description: 'Нагружаемые суставы' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  jointIds?: number[];
}

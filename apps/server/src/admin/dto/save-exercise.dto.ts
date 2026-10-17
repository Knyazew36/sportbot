import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { TextList } from '@/catalog/text-list.decorator';
import { Trim } from '@/common/decorators/trim.decorator';

/** Форма упражнения справочника (business-tz, 5.2): создание и правка. */
export class SaveExerciseDto {
  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(2, { message: 'Название — от 2 символов' })
  @MaxLength(60, { message: 'Название — до 60 символов' })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Trim()
  @IsString()
  @MaxLength(2000)
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

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    enum: ['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT'],
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsIn(['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT'])
  equipment?: 'BARBELL' | 'DUMBBELL' | 'MACHINE' | 'BODYWEIGHT' | null;

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
    description: 'Из POST admin/catalog/image; null — убрать',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(200)
  imagePath?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Финишное положение, из POST admin/catalog/image; null — убрать',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(200)
  imageEndPath?: string | null;

  @ApiProperty({ type: [Number], description: 'Основные мышцы' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Нужна хотя бы одна основная мышца' })
  @IsInt({ each: true })
  primary: number[];

  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  secondary: number[];

  @ApiProperty({ type: [Number], description: 'Нагружаемые суставы' })
  @IsArray()
  @IsInt({ each: true })
  jointIds: number[];
}

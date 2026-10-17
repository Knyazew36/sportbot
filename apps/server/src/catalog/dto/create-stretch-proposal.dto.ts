import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

import { TextList } from '../text-list.decorator';

/**
 * Правка растяжки от пользователя: передаются поля формы, бэк оставит изменённые.
 * Правила полей — как у формы админа (SaveStretchDto); тип «заминка / разминка» не правится.
 */
export class CreateStretchProposalDto {
  @ApiProperty({ description: 'Растяжка, к которой правка' })
  @IsInt()
  stretchId: number;

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
  howTo?: string | null;

  @TextList('Шаги выполнения по порядку')
  steps?: string[];

  @TextList('Типичные ошибки, каждая с исправлением')
  mistakes?: string[];

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

  @ApiPropertyOptional({ description: 'Удержание, с' })
  @IsOptional()
  @IsInt()
  @Min(5, { message: 'Удержание — от 5 секунд' })
  @Max(300, { message: 'Удержание — до 300 секунд' })
  holdSeconds?: number;

  @ApiPropertyOptional({ description: 'На каждую сторону' })
  @IsOptional()
  @IsBoolean()
  perSide?: boolean;

  @ApiPropertyOptional({ type: [Number], description: 'Мышцы, которые тянет' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Отметь хотя бы одну мышцу' })
  @IsInt({ each: true })
  muscles?: number[];
}

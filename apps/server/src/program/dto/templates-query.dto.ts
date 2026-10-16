import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

/** «1,2» или повтор параметра → [1, 2]; нечисловое отсеет IsInt. */
const toIds = ({ value }: { value: unknown }): unknown =>
  (Array.isArray(value) ? value : String(value).split(','))
    .filter((v) => v !== '')
    .map(Number);

export class TemplatesQueryDto {
  @ApiPropertyOptional({
    example: 'присед',
    description: 'Поиск по названию и описанию: регистр и ё не важны',
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(60)
  filter_search?: string;

  @ApiPropertyOptional({
    type: String,
    example: '1,4',
    description:
      'Id тегов через запятую: внутри группы — любой из них, между группами — все',
  })
  @IsOptional()
  @Transform(toIds)
  @IsArray()
  @IsInt({ each: true })
  filter_tags?: number[];

  @ApiPropertyOptional({
    enum: ['templates', 'users'],
    default: 'templates',
    description:
      'Таб каталога: шаблоны администратора или программы пользователей',
  })
  @IsOptional()
  @IsIn(['templates', 'users'])
  filter_source?: 'templates' | 'users';
}

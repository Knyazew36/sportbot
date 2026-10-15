import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

export class CreateTemplateDto {
  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(1, { message: 'Название не может быть пустым' })
  @MaxLength(60, { message: 'Название — до 60 символов' })
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ type: [Number], description: 'Теги шаблона' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  tagIds?: number[];
}

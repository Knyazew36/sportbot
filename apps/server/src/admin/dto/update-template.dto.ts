import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
} from 'class-validator';

import { UpdateProgramDto } from '@/program/dto/update-program.dto';

export class UpdateTemplateDto extends UpdateProgramDto {
  @ApiPropertyOptional({
    type: [Number],
    description: 'Все теги шаблона: заменяют прежние',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  tagIds?: number[];

  @ApiPropertyOptional({ description: 'Показывать шаблон в каталоге' })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

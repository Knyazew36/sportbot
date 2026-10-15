import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsInt, IsOptional } from 'class-validator';

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
}

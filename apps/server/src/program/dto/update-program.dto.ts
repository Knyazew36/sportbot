import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

export class UpdateProgramDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1, { message: 'Название не может быть пустым' })
  @MaxLength(60, { message: 'Название — до 60 символов' })
  name?: string;

  @ApiPropertyOptional({ description: 'Описание — только у шаблона' })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Описание — до 1000 символов' })
  description?: string;
}

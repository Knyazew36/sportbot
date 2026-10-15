import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

import { TAG_CODE_PATTERN, TAG_NAME_MAX } from './create-program-tag.dto';

export class UpdateProgramTagDto {
  @ApiPropertyOptional({ example: 'home' })
  @IsOptional()
  @Trim()
  @IsString()
  @Matches(TAG_CODE_PATTERN, {
    message: 'Код — латиница в нижнем регистре, цифры и дефис',
  })
  @MaxLength(40, { message: 'Код — до 40 символов' })
  code?: string;

  @ApiPropertyOptional({ example: 'Дом' })
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1, { message: 'Название не может быть пустым' })
  @MaxLength(TAG_NAME_MAX, {
    message: `Название — до ${TAG_NAME_MAX} символов`,
  })
  name?: string;
}

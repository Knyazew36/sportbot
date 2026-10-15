import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  NotEquals,
} from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

import {
  GROUP_NAME_MAX,
  GROUP_RESERVED_CODE,
} from './create-program-tag-group.dto';
import { TAG_CODE_PATTERN } from './create-program-tag.dto';

export class UpdateProgramTagGroupDto {
  @ApiPropertyOptional({ example: 'place' })
  @IsOptional()
  @Trim()
  @IsString()
  @Matches(TAG_CODE_PATTERN, {
    message: 'Код — латиница в нижнем регистре, цифры и дефис',
  })
  @NotEquals(GROUP_RESERVED_CODE, { message: 'Код «q» занят поиском' })
  @MaxLength(40, { message: 'Код — до 40 символов' })
  code?: string;

  @ApiPropertyOptional({ example: 'Где занимаешься' })
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1, { message: 'Название не может быть пустым' })
  @MaxLength(GROUP_NAME_MAX, {
    message: `Название — до ${GROUP_NAME_MAX} символов`,
  })
  name?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  Matches,
  MaxLength,
  MinLength,
  NotEquals,
} from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

import { TAG_CODE_PATTERN } from './create-program-tag.dto';

/** Код группы — имя параметра фильтра в ссылке каталога; «q» там занят поиском. */
export const GROUP_RESERVED_CODE = 'q';
export const GROUP_NAME_MAX = 24;

export class CreateProgramTagGroupDto {
  @ApiProperty({
    example: 'place',
    description: 'Латинский ключ: параметр фильтра в ссылке',
  })
  @Trim()
  @IsString()
  @Matches(TAG_CODE_PATTERN, {
    message: 'Код — латиница в нижнем регистре, цифры и дефис',
  })
  @NotEquals(GROUP_RESERVED_CODE, { message: 'Код «q» занят поиском' })
  @MaxLength(40, { message: 'Код — до 40 символов' })
  code: string;

  @ApiProperty({ example: 'Где занимаешься' })
  @Trim()
  @IsString()
  @MinLength(1, { message: 'Название не может быть пустым' })
  @MaxLength(GROUP_NAME_MAX, {
    message: `Название — до ${GROUP_NAME_MAX} символов`,
  })
  name: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

export const TAG_CODE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** Название — подпись чипа: длинное не влезет в ряд кнопок бота. */
export const TAG_NAME_MAX = 24;

export class CreateProgramTagDto {
  @ApiProperty({ example: 'home', description: 'Латинский ключ для импорта' })
  @Trim()
  @IsString()
  @Matches(TAG_CODE_PATTERN, {
    message: 'Код — латиница в нижнем регистре, цифры и дефис',
  })
  @MaxLength(40, { message: 'Код — до 40 символов' })
  code: string;

  @ApiProperty({ example: 'Дом' })
  @Trim()
  @IsString()
  @MinLength(1, { message: 'Название не может быть пустым' })
  @MaxLength(TAG_NAME_MAX, {
    message: `Название — до ${TAG_NAME_MAX} символов`,
  })
  name: string;
}

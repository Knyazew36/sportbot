import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

export class CreateProgramDto {
  @ApiProperty({ example: 'Моя программа' })
  @Trim()
  @IsString()
  @MinLength(1, { message: 'Название не может быть пустым' })
  @MaxLength(60, { message: 'Название — до 60 символов' })
  name: string;
}

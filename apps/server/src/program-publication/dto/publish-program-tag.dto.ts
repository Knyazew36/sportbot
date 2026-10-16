import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, MaxLength, MinLength } from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

/** Свой тег автора: уходит на проверку вместе с программой. */
export class PublishProgramTagDto {
  @ApiProperty({ description: 'Группа, в ряд которой встаёт тег' })
  @IsInt()
  groupId: number;

  @ApiProperty({ example: 'Турник' })
  @Trim()
  @IsString()
  @MinLength(2, { message: 'Тег — от 2 символов' })
  @MaxLength(24, { message: 'Тег — до 24 символов' })
  name: string;
}

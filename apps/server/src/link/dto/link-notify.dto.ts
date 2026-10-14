import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsArray, IsIn } from 'class-validator';

export class LinkNotifyDto {
  @ApiProperty({
    enum: ['TELEGRAM', 'MAX'],
    isArray: true,
    description: 'Куда присылать вопросы и напоминания',
  })
  @IsArray()
  @ArrayMaxSize(2)
  @ArrayUnique()
  @IsIn(['TELEGRAM', 'MAX'], { each: true })
  channels: ('TELEGRAM' | 'MAX')[];
}

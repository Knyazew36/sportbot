import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

export class RejectRequestDto {
  @ApiProperty({ description: 'Причина для автора' })
  @Trim()
  @IsString()
  @MinLength(2, { message: 'Напиши причину' })
  @MaxLength(200)
  reason: string;
}

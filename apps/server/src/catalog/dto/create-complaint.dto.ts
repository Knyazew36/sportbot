import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsString, MaxLength, MinLength } from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

export class CreateComplaintDto {
  @ApiProperty({ enum: ['exercise', 'stretch'] })
  @IsIn(['exercise', 'stretch'])
  kind: 'exercise' | 'stretch';

  @ApiProperty({ description: 'Упражнение или растяжка' })
  @IsInt()
  id: number;

  @ApiProperty({ description: 'Что не так в описании' })
  @Trim()
  @IsString()
  @MinLength(1, { message: 'Напиши, что не так' })
  @MaxLength(500, { message: 'До 500 символов' })
  text: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateStretchExclusionDto {
  @ApiProperty({ description: 'Растяжка, которую больше не предлагать' })
  @IsInt()
  @IsPositive()
  stretchId: number;
}

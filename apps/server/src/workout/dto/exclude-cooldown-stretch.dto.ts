import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class ExcludeCooldownStretchDto {
  @ApiProperty({ description: 'Растяжка заминки, которую больше не предлагать' })
  @IsInt()
  @IsPositive()
  stretchId: number;
}

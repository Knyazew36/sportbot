import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class SwapCooldownStretchDto {
  @ApiProperty({ description: 'Растяжка заминки, которую заменить' })
  @IsInt()
  @IsPositive()
  stretchId: number;
}

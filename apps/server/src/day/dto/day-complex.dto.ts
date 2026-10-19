import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class DayComplexDto {
  @ApiProperty({
    description: 'Комплекс активной программы вместо предложенного по очереди',
  })
  @IsInt()
  complexId: number;
}

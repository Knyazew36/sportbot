import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class CreateBodyWeightDto {
  @ApiProperty({ example: 78.5, description: 'Вес за сегодня, кг' })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Вес — число, до двух знаков после точки' },
  )
  @Min(20, { message: 'Вес — от 20 кг' })
  @Max(400, { message: 'Вес — до 400 кг' })
  value: number;
}

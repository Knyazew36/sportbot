import { ApiProperty } from '@nestjs/swagger'
import { IsInt, Max, Min } from 'class-validator'

export class WorkHoursDto {
  @ApiProperty({ description: 'Начало рабочего дня, час (0–23)', example: 8 })
  @IsInt()
  @Min(0)
  @Max(23)
  start: number

  @ApiProperty({ description: 'Конец рабочего дня, час (1–24), больше начала', example: 22 })
  @IsInt()
  @Min(1)
  @Max(24)
  end: number
}

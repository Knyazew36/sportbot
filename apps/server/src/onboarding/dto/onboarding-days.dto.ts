import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  Max,
  Min,
} from 'class-validator';

export class OnboardingDaysDto {
  @ApiProperty({
    type: [Number],
    example: [1, 3, 5],
    description: 'Тренировочные дни: 0..6, 0 — воскресенье',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Выбери хотя бы один день' })
  @ArrayMaxSize(7)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  trainingDays: number[];
}

import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt } from 'class-validator';

export class AddComplexExercisesDto {
  @ApiProperty({
    type: [Number],
    description: 'Упражнения справочника или свои черновики',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Выбери хотя бы одно упражнение' })
  @ArrayMaxSize(30)
  @IsInt({ each: true })
  exerciseIds: number[];
}

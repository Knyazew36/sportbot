import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsBoolean, IsInt } from 'class-validator';

export class AddWorkoutItemsDto {
  @ApiProperty({
    description: 'Упражнения из справочника, в порядке выбора',
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  exerciseIds: number[];

  @ApiProperty({
    description: 'Добавить и в конец комплекса, а не только сегодня',
  })
  @IsBoolean()
  inComplex: boolean;
}

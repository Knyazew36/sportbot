import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
} from 'class-validator';

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

  @ApiPropertyOptional({
    description:
      'Упражнение комплекса, к суперсету которого добавить; одиночное станет суперсетом вместе с новыми',
  })
  @IsOptional()
  @IsInt()
  joinItemId?: number;

  @ApiPropertyOptional({
    description: 'Собрать выбранные в новый суперсет (нужно хотя бы два)',
  })
  @IsOptional()
  @IsBoolean()
  newSuperset?: boolean;
}

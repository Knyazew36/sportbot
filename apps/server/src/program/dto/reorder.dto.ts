import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt } from 'class-validator';

export class ReorderDto {
  @ApiProperty({ type: [Number], description: 'Все id в новом порядке' })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  ids: number[];
}

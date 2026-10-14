import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class CatalogSimilarQueryDto {
  @ApiProperty({ enum: ['exercise', 'stretch'] })
  @IsIn(['exercise', 'stretch'])
  kind: 'exercise' | 'stretch';

  @ApiProperty({ description: 'Введённое название' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}

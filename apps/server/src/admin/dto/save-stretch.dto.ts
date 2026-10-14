import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

/** Форма растяжки справочника (business-tz, 5.3): создание и правка. */
export class SaveStretchDto {
  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(2, { message: 'Название — от 2 символов' })
  @MaxLength(60, { message: 'Название — до 60 символов' })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Trim()
  @IsString()
  @MaxLength(2000)
  howTo?: string | null;

  @ApiProperty({ description: 'Удержание, с' })
  @IsInt()
  @Min(5, { message: 'Удержание — от 5 секунд' })
  @Max(300, { message: 'Удержание — до 300 секунд' })
  holdSeconds: number;

  @ApiProperty()
  @IsBoolean()
  perSide: boolean;

  @ApiProperty({ enum: ['COOLDOWN', 'WARMUP'] })
  @IsIn(['COOLDOWN', 'WARMUP'])
  kind: 'COOLDOWN' | 'WARMUP';

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(200)
  imagePath?: string | null;

  @ApiProperty({ type: [Number], description: 'Мышцы, которые тянет' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Отметь хотя бы одну мышцу' })
  @IsInt({ each: true })
  muscles: number[];
}

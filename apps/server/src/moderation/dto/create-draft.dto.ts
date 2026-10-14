import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

export class CreateDraftDto {
  @ApiProperty({ enum: ['exercise', 'stretch'] })
  @IsIn(['exercise', 'stretch'])
  kind: 'exercise' | 'stretch';

  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(2, { message: 'Название — от 2 символов' })
  @MaxLength(60, { message: 'Название — до 60 символов' })
  name: string;

  @ApiProperty({
    type: [Number],
    description: 'Упражнение: основные мышцы; растяжка: мышцы, которые тянет',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Отметь хотя бы одну мышцу' })
  @ArrayMaxSize(20)
  @IsInt({ each: true })
  primary: number[];

  @ApiPropertyOptional({
    type: [Number],
    description: 'Вспомогательные мышцы упражнения',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsInt({ each: true })
  secondary?: number[];

  @ApiPropertyOptional({
    description: 'Техника (упражнение) или «как делать» (растяжка)',
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(2000)
  technique?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({}, { message: 'Ссылка на видео — полный адрес https://…' })
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Растяжка: удержание, с' })
  @IsOptional()
  @IsInt()
  @Min(5, { message: 'Удержание — от 5 секунд' })
  @Max(300, { message: 'Удержание — до 300 секунд' })
  holdSeconds?: number;

  @ApiPropertyOptional({ description: 'Растяжка: на каждую сторону' })
  @IsOptional()
  @IsBoolean()
  perSide?: boolean;
}

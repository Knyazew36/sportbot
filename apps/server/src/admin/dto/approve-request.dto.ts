import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

export class ApproveRequestDto {
  @ApiPropertyOptional({
    description: 'Короткая причина или комментарий для автора',
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(200)
  reason?: string;

  @ApiPropertyOptional({ description: 'С правками: название записи' })
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(2, { message: 'Название — от 2 символов' })
  @MaxLength(60, { message: 'Название — до 60 символов' })
  name?: string;

  @ApiPropertyOptional({ description: 'С правками: техника или «как делать»' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(2000)
  text?: string;

  @ApiPropertyOptional({
    description: 'С правками: картинка из POST admin/catalog/image',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  imagePath?: string;

  @ApiPropertyOptional({
    enum: ['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT'],
  })
  @IsOptional()
  @IsIn(['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT'])
  equipment?: 'BARBELL' | 'DUMBBELL' | 'MACHINE' | 'BODYWEIGHT';

  @ApiPropertyOptional({ type: [Number], description: 'Нагружаемые суставы' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  jointIds?: number[];
}

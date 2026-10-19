import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

import { WARMUP_MINUTES } from '../warmup';

/** Кардио задаётся упражнениями на время в самом комплексе, отдельного блока больше нет. */
export class UpdateComplexDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1, { message: 'Название не может быть пустым' })
  @MaxLength(60, { message: 'Название — до 60 символов' })
  name?: string;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description:
      'Разминка, мин: 0, 5, 10 или 15; null — как в профиле, 0 — без разминки',
  })
  @IsOptional()
  @IsIn(WARMUP_MINUTES, { message: 'Разминка — 0, 5, 10 или 15 минут' })
  warmupMinutes?: number | null;
}

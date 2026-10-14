import { ApiPropertyOptional } from '@nestjs/swagger';
import {
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

export class UpdateComplexDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1, { message: 'Название не может быть пустым' })
  @MaxLength(60, { message: 'Название — до 60 символов' })
  name?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Кардио после комплекса; null или пусто — убрать',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(40, { message: 'Название кардио — до 40 символов' })
  cardioName?: string | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Минут кардио',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1, { message: 'Минут — от 1' })
  @Max(300, { message: 'Минут — до 300' })
  cardioMinutes?: number | null;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches, ValidateIf } from 'class-validator';

export class StartPauseDto {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '2026-10-20',
    description: 'Последний день паузы; null или без поля — до отмены',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Дата в формате ГГГГ-ММ-ДД' })
  endDate?: string | null;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Matches, ValidateIf } from 'class-validator';

export class CreateLimitationDto {
  @ApiProperty({ description: 'Зона (сустав)' })
  @IsInt()
  jointId: number;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '2026-11-01',
    description: 'До какой даты; null или без поля — до отмены',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Дата в формате ГГГГ-ММ-ДД' })
  endDate?: string | null;
}

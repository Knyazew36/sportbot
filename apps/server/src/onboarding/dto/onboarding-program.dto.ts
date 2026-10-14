import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';

export class OnboardingProgramDto {
  @ApiPropertyOptional({
    description: 'Шаблон, копия которого станет программой',
  })
  @IsOptional()
  @IsInt()
  templateId?: number;

  @ApiPropertyOptional({ description: 'Собрать программу с нуля' })
  @IsOptional()
  @IsBoolean()
  scratch?: boolean;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

export class FinishWorkoutDto {
  @ApiPropertyOptional({
    description:
      'Когда нажали «Завершить» на клиенте (ISO). Офлайн-завершение доезжает позже — длительность считается по этому времени',
  })
  @IsOptional()
  @IsISO8601()
  finishedAt?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

export class ClientAtDto {
  @ApiPropertyOptional({
    description:
      'Когда нажали на клиенте (ISO). Запрос из офлайн-очереди доезжает позже — время берётся отсюда',
  })
  @IsOptional()
  @IsISO8601()
  at?: string;
}

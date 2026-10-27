import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

export class SyncPullQueryDto {
  @ApiPropertyOptional({
    type: String,
    description:
      'Курсор из прошлого ответа (ISO). Без него — полный снимок данных пользователя',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'Курсор — время в ISO' })
  since?: string;
}

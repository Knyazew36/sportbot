import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryAuditLogDto {
  @ApiProperty({ type: Number, description: 'ID организации', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organizationId: number;

  @ApiPropertyOptional({
    type: String,
    example: 'invite',
    description: 'Фильтр по сущности (сегмент маршрута)',
  })
  @IsString()
  @IsOptional()
  entity?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'invite.create',
    description: 'Фильтр по действию ("<entity>.<verb>")',
  })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Фильтр по автору действия',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional({
    type: String,
    example: '2026-07-01',
    description: 'Начало периода (по дате действия)',
  })
  @IsISO8601()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({
    type: String,
    example: '2026-07-25',
    description: 'Конец периода (включительно)',
  })
  @IsISO8601()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    default: 1,
    description: 'Номер страницы',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page? = 1;

  @ApiPropertyOptional({
    type: Number,
    example: 30,
    default: 30,
    description: 'Элементов на странице',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  limit? = 30;
}

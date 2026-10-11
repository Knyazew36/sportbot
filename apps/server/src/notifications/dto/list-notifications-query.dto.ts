import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Только непрочитанные' })
  @IsOptional()
  // Query-строка: @Type(() => Boolean) даёт Boolean('false') === true — приводим по значению строки
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  filter_unread?: boolean;

  @ApiPropertyOptional({ description: 'Только уведомления этой организации' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  filter_organizationId?: number;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    type: Number,
    example: 1,
    minimum: 1,
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
    example: 25,
    minimum: 1,
    maximum: 1000,
    default: 25,
    description: 'Количество элементов на странице',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  limit? = 25;

  @ApiPropertyOptional({
    type: String,
    example: 'createdAt',
    default: 'createdAt',
    description:
      'Поле для сортировки. Допустимые поля задаёт конкретный список (по умолчанию id, createdAt)',
  })
  @IsString()
  @IsOptional()
  sortBy? = 'createdAt';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    default: 'desc',
    description: 'Направление сортировки',
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  order?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    example: 'timeout',
    description: 'Поиск/фильтр (опционально)',
  })
  @IsString()
  @IsOptional()
  search?: string;
}

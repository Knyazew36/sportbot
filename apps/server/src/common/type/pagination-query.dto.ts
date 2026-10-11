import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator'

export class PaginationQueryDto {
  @ApiPropertyOptional({ type: Number, example: 1, minimum: 1, default: 1, description: 'Номер страницы' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page? = 1

  @ApiPropertyOptional({
    type: Number,
    example: 25,
    minimum: 1,
    maximum: 300,
    default: 25,
    description: 'Количество элементов на странице'
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  limit? = 25

  @ApiPropertyOptional({ type: String, example: 'createdAt', default: 'createdAt', description: 'Поле для сортировки' })
  @IsString()
  @IsOptional()
  sortBy? = 'createdAt'

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc', description: 'Направление сортировки' })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  order?: 'asc' | 'desc' = 'asc'

  @ApiPropertyOptional({ example: 'timeout', description: 'Поиск/фильтр (опционально)' })
  @IsString()
  @IsOptional()
  search?: string

  @ApiPropertyOptional({ example: 'include', description: 'что включить в результат' })
  @IsObject()
  @IsOptional()
  include?: Record<string, unknown>
}

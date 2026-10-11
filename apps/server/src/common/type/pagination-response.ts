import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';

import { BaseResponse } from './base-response';

export class PaginationMeta {
  @ApiPropertyOptional({
    description: 'Элементов всего',
    example: 100,
  })
  @IsInt()
  @IsOptional()
  total?: number;

  @ApiProperty({
    description: 'Страница',
    example: 1,
  })
  @IsInt()
  @IsOptional()
  page: number;

  @ApiProperty({
    description: 'Лимит',
    example: 10,
  })
  @IsInt()
  @IsOptional()
  limit: number;

  @ApiProperty({
    description: 'Страниц всего',
    example: 10,
  })
  @IsInt()
  @IsOptional()
  totalPages: number;

  @ApiProperty({
    description: 'Есть ли следующая страница',
    example: true,
  })
  @IsBoolean()
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Есть ли предыдущая страница',
    example: true,
  })
  @IsBoolean()
  hasPrevPage: boolean;
}

export class PaginationResponseData<T> {
  @ApiProperty({
    description: 'Элементы списка',
    isArray: true,
  })
  items: T[];

  @ApiProperty({
    description: 'Мета данные',
    type: PaginationMeta,
  })
  meta: PaginationMeta;
}

export class PaginationResponse<T> extends BaseResponse<
  PaginationResponseData<T>
> {}

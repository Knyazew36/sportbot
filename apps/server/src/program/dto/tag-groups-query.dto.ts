import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class TagGroupsQueryDto {
  @ApiPropertyOptional({
    type: Boolean,
    description:
      'Все теги справочника, а не только с опубликованными шаблонами — для формы публикации',
  })
  @IsOptional()
  @Transform(
    ({ value }: { value: unknown }) => value === true || value === 'true',
  )
  @IsBoolean()
  filter_all?: boolean;
}

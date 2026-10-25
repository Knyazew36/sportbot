import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CopyComplexDto {
  @ApiPropertyOptional({
    description:
      'Токен ссылки «Поделиться», если тренировку копируют из программы по ссылке',
  })
  @IsOptional()
  @IsString()
  shareToken?: string;

  @ApiPropertyOptional({
    description: 'Своя программа, куда копировать; без неё — активная',
  })
  @IsOptional()
  @IsInt()
  programId?: number;
}

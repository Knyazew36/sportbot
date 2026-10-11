import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsOptional } from 'class-validator'

export class DeleteMemberDto {
  @ApiPropertyOptional({
    description:
      'Только при выходе самого участника: `true` — вместе с ним удалить из кружка его детей (членство, группы, будущие записи).',
  })
  @IsOptional()
  @IsBoolean()
  removeChildren?: boolean
}

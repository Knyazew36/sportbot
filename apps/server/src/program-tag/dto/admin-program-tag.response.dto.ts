import { ApiProperty } from '@nestjs/swagger';

import { ProgramTagResponseDto } from './program-tag.response.dto';

export class AdminProgramTagResponseDto extends ProgramTagResponseDto {
  @ApiProperty({ description: 'Сколько шаблонов с этим тегом' })
  templateCount: number;
}

import { ApiProperty } from '@nestjs/swagger';

export class ProgramCopyResponseDto {
  @ApiProperty({ description: 'Копия в программах пользователя' })
  programId: number;
}

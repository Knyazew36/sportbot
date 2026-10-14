import { ApiProperty } from '@nestjs/swagger';

export class CreateLimitationResponseDto {
  @ApiProperty()
  jointName: string;

  @ApiProperty({
    description: 'Первое включение — показать дисклеймер «не заменяет врача»',
  })
  showDisclaimer: boolean;
}

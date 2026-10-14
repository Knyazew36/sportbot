import { ApiProperty } from '@nestjs/swagger';

export class OnboardingTemplateResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Сколько комплексов в очереди' })
  complexCount: number;
}

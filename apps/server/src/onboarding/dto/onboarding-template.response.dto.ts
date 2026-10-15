import { ApiProperty } from '@nestjs/swagger';

import { ProgramTagResponseDto } from '@/program-tag/dto/program-tag.response.dto';

export class OnboardingTemplateResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Сколько комплексов в очереди' })
  complexCount: number;

  @ApiProperty({
    type: [ProgramTagResponseDto],
    description: 'Теги по порядку чипов',
  })
  tags: ProgramTagResponseDto[];
}

import { ApiProperty } from '@nestjs/swagger';

export class BaseResponse<T> {
  @ApiProperty({
    description: 'Статус ответа',
    example: 'success',
    enum: ['success'],
  })
  status: 'success';

  @ApiProperty({
    description: 'Данные ответа',
  })
  data: T;

  @ApiProperty({
    description: 'Временная метка ответа в формате ISO',
    example: '2024-01-15T12:00:00.000Z',
  })
  timestamp: string;
}

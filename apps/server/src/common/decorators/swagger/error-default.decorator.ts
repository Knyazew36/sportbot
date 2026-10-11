import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiProperty,
} from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Сообщение об ошибке',
    example: 'Internal server error',
  })
  message: string;

  @ApiProperty({
    description: 'Стек ошибки (только в dev режиме)',
    required: false,
    example: 'Error: ...\n    at ...',
  })
  exception?: string;

  @ApiProperty({
    description: 'Временная метка ошибки в формате ISO',
    example: '2024-01-15T12:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Путь запроса, на котором произошла ошибка',
    example: '/api/users',
  })
  path: string;

  @ApiProperty({
    description: 'HTTP статус код ошибки',
    example: 500,
  })
  status: number;
}

export function ErrorDefault() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiBadRequestResponse({
      type: ErrorResponseDto,
      description: 'Ошибка запроса',
    }),
  );
}

import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  getSchemaPath,
} from '@nestjs/swagger';

export interface MessengerApiConfig {
  title: string;
  response: Type<unknown>;
}

/**
 * Описание эндпоинта модулей мессенджеров для OpenAPI. Свой декоратор, а не проектный:
 * модули не зависят от кода проекта. Схема ответа повторяет конверт, в который проект
 * оборачивает ответы ({ status, data, timestamp }); если в проекте конверта нет — поправить здесь.
 * Query-параметры Nest берёт сам из @ApiProperty на DTO.
 */
export const MessengerApi = ({ title, response }: MessengerApiConfig) =>
  applyDecorators(
    ApiOperation({ summary: title }),
    ApiExtraModels(response),
    ApiOkResponse({
      schema: {
        type: 'object',
        required: ['status', 'data', 'timestamp'],
        properties: {
          status: { type: 'string', example: 'success' },
          data: { $ref: getSchemaPath(response) },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    }),
  );

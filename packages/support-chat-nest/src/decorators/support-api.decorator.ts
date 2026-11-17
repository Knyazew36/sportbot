import { SUPPORT_VISIT_HEADER } from '@app/support-chat-core'
import { applyDecorators, type Type } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  getSchemaPath,
} from '@nestjs/swagger'

import { SupportCursorMetaDto } from '../dto/support-cursor-meta.dto'
import { SupportPageMetaDto } from '../dto/support-page-meta.dto'

export interface SupportApiConfig {
  title: string
  response: Type<unknown>
  /** page — { items, meta: страницы }, cursor — { items, meta: { hasMore } } */
  list?: 'page' | 'cursor'
  /** Кто вызывает: посетитель (заголовок токена визита) или оператор (авторизация проекта). */
  auth?: 'visit' | 'operator'
  /** DTO тела multipart-запроса: к его полям добавляется files[]. */
  multipart?: Type<unknown>
}

/**
 * Описание эндпоинта для OpenAPI. Свой декоратор, а не проектный: модуль не зависит от кода проекта.
 * Схема ответа повторяет конверт, в который проект оборачивает ответы ({ status, data, timestamp });
 * если в проекте конверта нет — поправить здесь. Query-параметры Nest берёт из @ApiProperty DTO.
 */
export const SupportApi = ({ title, response, list, auth, multipart }: SupportApiConfig) => {
  const data = list
    ? {
        type: 'object',
        required: ['items', 'meta'],
        properties: {
          items: { type: 'array', items: { $ref: getSchemaPath(response) } },
          meta: { $ref: getSchemaPath(list === 'page' ? SupportPageMetaDto : SupportCursorMetaDto) },
        },
      }
    : { $ref: getSchemaPath(response) }

  return applyDecorators(
    ApiOperation({ summary: title }),
    ...(auth === 'operator' ? [ApiBearerAuth()] : []),
    ...(auth === 'visit'
      ? [ApiHeader({ name: SUPPORT_VISIT_HEADER, required: true, description: 'Токен визита' })]
      : []),
    ...(multipart
      ? [
          ApiConsumes('multipart/form-data'),
          ApiExtraModels(multipart),
          ApiBody({
            schema: {
              allOf: [
                { $ref: getSchemaPath(multipart) },
                {
                  type: 'object',
                  properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } },
                },
              ],
            },
          }),
        ]
      : []),
    ApiExtraModels(response, SupportPageMetaDto, SupportCursorMetaDto),
    ApiOkResponse({
      schema: {
        type: 'object',
        required: ['status', 'data', 'timestamp'],
        properties: {
          status: { type: 'string', example: 'success' },
          data,
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    }),
  )
}

import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiParamOptions,
  ApiProduces,
  ApiQuery,
  getSchemaPath,
} from '@nestjs/swagger';

import { PaginationMeta, PaginationResponse } from '@/common/type';
import { BaseResponse } from '@/common/type/base-response';

// @nestjs/swagger 12 (ESM) не экспортирует dist/constants — берём ключ метаданных напрямую.
const API_MODEL_PROPERTIES = 'swagger/apiModelProperties';

export type SwaggerConfig<
  TReturns extends Type<unknown>,
  TBody extends Type<unknown> | undefined = undefined,
> = {
  response?: TReturns;
  body?: TBody;
  /** data: {items: TReturns[], meta: PaginationMeta} — для реально пагинированных списков */
  isArray?: boolean;
  /** data: TReturns[] — для простых непагинированных списков (не путать с isArray) */
  plainArray?: boolean;
  title?: string;
  /** Пометить эндпоинт как требующий Bearer-токен (@ApiBearerAuth) — ставить рядом с MultiAuthGuard */
  bearerAuth?: boolean;
  param?: ApiParamOptions;
  query?: Type<unknown>;
  /** MIME-тип ответа (@ApiProduces), например 'application/pdf' — для бинарных эндпоинтов */
  produces?: string;
  /** Ответ — не BaseResponse-обёрнутый JSON, а сырой файл (buffer/stream): пропускает ApiOkResponse */
  binary?: boolean;
};

/**
 * Извлекает метаданные полей из класса DTO для создания отдельных @ApiQuery декораторов
 */
function getQueryDecoratorsFromClass(queryClass: Type<unknown>) {
  // Получаем метаданные из класса
  const prototype = queryClass.prototype;
  const properties: string[] =
    Reflect.getMetadata(API_MODEL_PROPERTIES, prototype) || [];

  return properties.map((propertyKey) => {
    const metadata = Reflect.getMetadata(
      API_MODEL_PROPERTIES,
      prototype,
      propertyKey,
    );

    // Преобразуем конструктор типа в строковое представление для OpenAPI
    let type = metadata?.type;
    if (type === Number) {
      type = 'number';
    } else if (type === String) {
      type = 'string';
    } else if (type === Boolean) {
      type = 'boolean';
    }

    return ApiQuery({
      name: propertyKey,
      required: metadata?.required ?? false,
      type: type,
      enum: metadata?.enum,
      example: metadata?.example,
      description: metadata?.description,
      default: metadata?.default,
      minimum: metadata?.minimum,
      maximum: metadata?.maximum,
    });
  });
}

export function Swagger<
  TReturns extends Type<unknown>,
  TBody extends Type<unknown> | undefined = undefined,
>(config: SwaggerConfig<TReturns, TBody>): MethodDecorator & ClassDecorator;
export function Swagger<
  TReturns extends Type<unknown>,
  TBody extends Type<unknown> | undefined = undefined,
>(config: SwaggerConfig<TReturns, TBody>) {
  const {
    response = BaseResponse,
    body,
    isArray = false,
    plainArray = false,
    title,
    bearerAuth = false,
    param,
    query,
    produces,
    binary = false,
  } = config;

  const queryDecorators = query ? getQueryDecoratorsFromClass(query) : [];

  return applyDecorators(
    ...(title ? [ApiOperation({ summary: title })] : []),
    ...(bearerAuth ? [ApiBearerAuth()] : []),
    ...(body ? [ApiBody({ type: body })] : []),
    ...(param ? [ApiParam(param)] : []),
    ...queryDecorators,
    ...(produces ? [ApiProduces(produces)] : []),
    ...(binary
      ? []
      : [
          ApiExtraModels(
            BaseResponse,
            PaginationResponse<TReturns>,
            PaginationMeta,
            response,
            ...(body ? [body] : []),
            ...(query ? [query] : []),
          ),
          ApiOkResponse({
            schema: {
              allOf: [
                {
                  $ref: getSchemaPath(
                    isArray ? PaginationResponse<TReturns> : BaseResponse,
                  ),
                },
                {
                  properties: {
                    data: isArray
                      ? {
                          type: 'object',
                          properties: {
                            items: {
                              type: 'array',
                              items: { $ref: getSchemaPath(response) },
                            },
                            meta: {
                              $ref: getSchemaPath(PaginationMeta),
                            },
                          },
                        }
                      : plainArray
                        ? {
                            type: 'array',
                            items: { $ref: getSchemaPath(response) },
                          }
                        : { $ref: getSchemaPath(response) },
                  },
                },
              ],
            },
          }),
        ]),
  );
}

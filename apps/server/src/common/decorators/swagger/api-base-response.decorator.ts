import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

import { BaseResponse } from '@/common/type/base-response';

export const ApiBaseOkResponse = <TModel extends Type<unknown>>(
  model: TModel,
  description?: string,
  isArray = false,
) =>
  applyDecorators(
    ApiExtraModels(BaseResponse, model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(BaseResponse) },
          {
            properties: {
              data: isArray
                ? { type: 'array', items: { $ref: getSchemaPath(model) } }
                : { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );

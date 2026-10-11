import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

interface ApiQueryParamsOptions {
  sort?: boolean | string[];
  order?: boolean;
  limit?: boolean;
  filter?: boolean;
  /**
   * Additional custom query parameters
   */
  custom?: Array<{
    name: string;
    type?: any;
    required?: boolean;
    description?: string;
    enum?: any[];
  }>;
}

/**
 * Composite decorator for common query parameters
 * @example
 * ```
 * @ApiQueryParams({
 *   sort: ['totalTime', 'title'],
 *   order: true,
 *   limit: true,
 *   filter: true,
 *   custom: [
 *     { name: 'department', type: String, description: 'Department filter' }
 *   ]
 * })
 * ```
 */
export function ApiQueryParams(options: ApiQueryParamsOptions = {}) {
  const decorators: Array<
    ClassDecorator | MethodDecorator | PropertyDecorator
  > = [];

  // Sort parameter
  if (options.sort) {
    const sortEnum = Array.isArray(options.sort) ? options.sort : undefined;
    decorators.push(
      ApiQuery({
        name: 'sort',
        required: false,
        enum: sortEnum,
        type: sortEnum ? undefined : String,
        description: sortEnum
          ? `Sort field (${sortEnum.join(', ')})`
          : 'Sort field',
      }),
    );
  }

  // Order parameter
  if (options.order) {
    decorators.push(
      ApiQuery({
        name: 'order',
        required: false,
        enum: ['asc', 'desc'],
        description: 'Sort order',
      }),
    );
  }

  // Limit parameter
  if (options.limit) {
    decorators.push(
      ApiQuery({
        name: 'limit',
        required: false,
        type: String,
        description: 'Limit number of results',
      }),
    );
  }

  // Filter parameter
  if (options.filter) {
    decorators.push(
      ApiQuery({
        name: 'filter',
        required: false,
        type: String,
        description: 'Filter string',
      }),
    );
  }

  // Custom parameters
  if (options.custom && options.custom.length > 0) {
    options.custom.forEach((customParam) => {
      decorators.push(
        ApiQuery({
          name: customParam.name,
          required: customParam.required ?? false,
          type: customParam.type ?? String,
          description: customParam.description,
          enum: customParam.enum,
        }),
      );
    });
  }

  return applyDecorators(...decorators);
}

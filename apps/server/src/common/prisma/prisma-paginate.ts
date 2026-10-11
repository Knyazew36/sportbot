import { BadRequestException } from '@nestjs/common';

import { PaginationQueryDto } from '../type';

type PrismaDelegate<TArgs, TResult> = {
  findMany: (args?: TArgs) => Promise<TResult[]>;
  count: (args?: {
    where?: TArgs extends { where?: infer W } ? W : never;
  }) => Promise<number>;
};

type PaginateOptions<TArgs> = PaginationQueryDto & {
  where?: TArgs extends { where?: infer W } ? W : never;
  include?: TArgs extends { include?: infer I } ? I : never;
  select?: TArgs extends { select?: infer S } ? S : never;
  omit?: TArgs extends { omit?: infer Om } ? Om : never;
  orderBy?: TArgs extends { orderBy?: infer O } ? O : never;
  /** Поля, по которым клиент может сортировать через sortBy. По умолчанию — id и createdAt. */
  sortable?: string[];
};

const DEFAULT_SORTABLE = ['id', 'createdAt'];

export async function paginatePrisma<TArgs, TResult>(
  model: PrismaDelegate<TArgs, TResult>,
  options: PaginateOptions<TArgs>,
): Promise<{
  items: TResult[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(1000, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  // sortBy приходит от клиента: произвольное поле дало бы 500 от Prisma или сортировку по закрытой колонке
  const sortable = options.sortable ?? DEFAULT_SORTABLE;
  if (
    !options.orderBy &&
    options.sortBy &&
    !sortable.includes(options.sortBy)
  ) {
    throw new BadRequestException(
      `Сортировка по полю «${options.sortBy}» недоступна. Допустимо: ${sortable.join(', ')}`,
    );
  }

  const orderBy =
    options.orderBy ??
    (options.sortBy
      ? { [options.sortBy]: options.order ?? 'desc' }
      : { createdAt: 'desc' });

  const [total, items] = await Promise.all([
    model.count({ where: options.where }),
    model.findMany({
      where: options.where,
      orderBy,
      include: options.include,
      select: options.select,
      omit: options.omit,
      skip,
      take: limit,
    } as any),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

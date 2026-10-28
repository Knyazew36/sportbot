import { BadRequestException } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

/**
 * Поля операции — по DTO её типа: payload приходит свободным объектом, граница проверки — здесь.
 * Ошибка — BadRequest, то есть rejected этой операции, а не сбой пачки.
 */
export const parsePayload = async <T extends object>(
  cls: ClassConstructor<T>,
  payload: Record<string, unknown>,
): Promise<T> => {
  const dto = plainToInstance(cls, payload);
  const errors = await validate(dto, { whitelist: true });
  if (errors.length)
    throw new BadRequestException(
      `Неверные поля операции: ${errors.map((e) => e.property).join(', ')}`,
    );
  return dto;
};

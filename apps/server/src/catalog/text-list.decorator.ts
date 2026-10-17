import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Шаги или ошибки записи справочника: список строк из формы.
 * Пустые пункты отбрасываются здесь — кнопка «+ Добавить» оставляет незаполненные строки.
 */
export const TextList = (description: string) =>
  applyDecorators(
    ApiPropertyOptional({ type: [String], description }),
    IsOptional(),
    Transform(({ value }: { value: unknown }) =>
      Array.isArray(value)
        ? value
            .map((item: unknown) =>
              typeof item === 'string' ? item.trim() : item,
            )
            .filter((item) => item !== '')
        : value,
    ),
    IsArray(),
    ArrayMaxSize(20, { message: 'До 20 пунктов' }),
    IsString({ each: true }),
    MaxLength(300, { each: true, message: 'Пункт — до 300 символов' }),
  );

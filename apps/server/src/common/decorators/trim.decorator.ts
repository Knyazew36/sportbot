import { Transform } from 'class-transformer';

/** Обрезает пробелы по краям строки до валидации: «  Грудь » → «Грудь». */
export const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

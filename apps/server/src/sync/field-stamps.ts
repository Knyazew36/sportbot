import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from 'prisma/prisma.service';

/** { поле: ISO } — колонка fieldUpdatedAt */
type FieldStamps = Record<string, string>;

/** Строки, у которых есть fieldUpdatedAt: таблица и колонка ключа */
const STAMP_TABLES = {
  profile: { table: 'SportProfile', key: 'userId' },
  program: { table: 'Program', key: 'id' },
  complex: { table: 'Complex', key: 'id' },
  complexItem: { table: 'ComplexExercise', key: 'id' },
} as const;

type StampTarget = keyof typeof STAMP_TABLES;

/**
 * Поля правки, которые не правили позже `at`. Более позднюю правку (веб, бот, другой телефон)
 * офлайн-операция, дошедшая с опозданием, не затирает — остальные поля той же правки применяются
 */
export const freshFields = <T extends object>(
  dto: T,
  stamps: Prisma.JsonValue,
  at: Date,
): Partial<T> => {
  const known = (stamps ?? {}) as FieldStamps;
  return Object.fromEntries(
    Object.entries(dto).filter(
      ([field, value]) =>
        value !== undefined &&
        !(known[field] && Date.parse(known[field]) > at.getTime()),
    ),
  ) as Partial<T>;
};

/**
 * Время правки полям строки. Слияние jsonb || в базе, а не чтение-запись: одновременная правка
 * другого поля той же строки не теряет свою отметку
 */
export const stampFields = async (
  prisma: PrismaService | Prisma.TransactionClient,
  target: StampTarget,
  id: number,
  fields: string[],
  at: Date = new Date(),
): Promise<void> => {
  if (!fields.length) return;
  const { table, key } = STAMP_TABLES[target];
  const stamps: FieldStamps = Object.fromEntries(
    fields.map((field) => [field, at.toISOString()]),
  );
  await prisma.$executeRaw`UPDATE ${Prisma.raw(`"${table}"`)} SET "fieldUpdatedAt" = "fieldUpdatedAt" || ${JSON.stringify(stamps)}::jsonb WHERE ${Prisma.raw(`"${key}"`)} = ${id}`;
};

/** Ключи правки с заданными значениями — их и отмечаем */
export const definedFields = (data: object): string[] =>
  Object.entries(data)
    .filter(([, value]) => value !== undefined)
    .map(([field]) => field);

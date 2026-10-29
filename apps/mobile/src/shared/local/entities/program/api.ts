import type { Program } from '@sportbot/api/entities/program';
import type { AddComplexExercisesDto, UpdateComplexExerciseDto } from '@sportbot/api/generated/model';
import { programControllerList, programControllerView } from '@sportbot/api/generated/program/program';

import { type LocalDb, useLocalDb } from '@/shared/db';

import { useLocalMutation } from '../../local-mutation';
import { useLocalQuery } from '../../local-query';
import { readProgram, readPrograms } from './read-program';
import {
  activateProgram,
  addComplex,
  addComplexExercises,
  createProgram,
  deleteComplex,
  deleteComplexExercise,
  deleteProgram,
  makeNextComplex,
  renameProgram,
  reorderComplexes,
  reorderComplexExercises,
  ungroupComplexExercise,
  ungroupSuperset,
  updateComplex,
  updateComplexExercise,
} from './write-program';

// Свои программы на базе телефона: чтение и правка без сети. Каталог, шаблоны, ссылки и публикация —
// REST-хуки пакета: им нужен сервер

const useDb = () => {
  const db = useLocalDb();
  return (): LocalDb => {
    if (!db) throw new Error('База на телефоне ещё открывается — повторите через секунду');
    return db;
  };
};

/** Программа после правки — ответом мутации, как раньше от сервера */
const programOf = (db: LocalDb, id: number): Program => {
  const program = readProgram(db, id);
  if (!program) throw new Error('Программа не найдена.');
  return program;
};

/** Мутация редактора: правка в базе, ответ — программа целиком */
const useProgramEdit = <V>(
  edit: (db: LocalDb, vars: V) => number,
  meta: { successMessage?: string; skipSuccessToast?: boolean },
) => {
  const db = useDb();
  return useLocalMutation({
    mutationFn: async (vars: V) => programOf(db(), edit(db(), vars)),
    meta,
  });
};

export const usePrograms = () =>
  useLocalQuery({ key: ['program', 'list'], read: readPrograms, fallback: () => programControllerList() });

export const useProgram = (id: number | undefined) =>
  useLocalQuery({
    key: ['program', 'detail', id ?? 0],
    read: (db) => readProgram(db, id!),
    fallback: () => (id! > 0 ? programControllerView(id!) : Promise.reject(new Error('Программа ещё не загружена'))),
    // Нет активной программы — нечего читать
    enabled: id != null,
  });

/** Активная программа целиком: по ней идёт очередь и в неё «Добавить в комплекс» */
export const useActiveProgram = () => {
  const list = usePrograms();
  return useProgram(list.data?.find((p) => p.active)?.id);
};

// ── Программа ───────────────────────────────────────────────────────────────

export const useCreateProgram = () =>
  // Сразу открывается редактор новой программы — результат и так виден
  useProgramEdit((db, name: string) => createProgram(db, name), { skipSuccessToast: true });

export const useRenameProgram = () =>
  useProgramEdit((db, { id, name }: { id: number; name: string }) => renameProgram(db, id, name), {
    successMessage: 'Программа переименована',
  });

/** silent — без тоста: в списке программ строка исчезает сама, это и есть ответ */
export const useDeleteProgram = ({ silent = false }: { silent?: boolean } = {}) => {
  const db = useDb();
  return useLocalMutation({
    mutationFn: async (id: number) => deleteProgram(db(), id),
    meta: silent ? { skipSuccessToast: true } : { successMessage: 'Программа удалена, история тренировок осталась' },
  });
};

export const useActivateProgram = () =>
  useProgramEdit((db, id: number) => activateProgram(db, id), { successMessage: 'Программа активна' });

// ── Комплексы ───────────────────────────────────────────────────────────────

export const useAddComplex = () =>
  // После добавления сразу открывается страница нового комплекса — результат и так виден
  useProgramEdit(
    (db, { programId, name }: { programId: number; name: string }) => addComplex(db, programId, name),
    { skipSuccessToast: true },
  );

/** Ручной выбор следующего в очереди: подсветка на «Программах» и комплекс дня на «Сегодня» */
export const useMakeNextComplex = () =>
  useProgramEdit((db, id: number) => makeNextComplex(db, id), { successMessage: 'Тренировка следующая в очереди' });

export const useRenameComplex = () =>
  useProgramEdit((db, { id, name }: { id: number; name: string }) => updateComplex(db, id, { name }), {
    successMessage: 'Тренировка переименована',
  });

/** Разминка комплекса: null — как в профиле, 0 — без разминки */
export const useSetComplexWarmup = () =>
  useProgramEdit(
    (db, { id, warmupMinutes }: { id: number; warmupMinutes: number | null }) => updateComplex(db, id, { warmupMinutes }),
    { successMessage: 'Разминка сохранена' },
  );

export const useDeleteComplex = () =>
  useProgramEdit((db, id: number) => deleteComplex(db, id), { successMessage: 'Тренировка удалена' });

export const useReorderComplexes = () =>
  // Новый порядок уже на экране: карточку перетащили руками
  useProgramEdit(
    (db, { programId, ids }: { programId: number; ids: number[] }) => reorderComplexes(db, programId, ids),
    { skipSuccessToast: true },
  );

// ── Упражнения комплекса ────────────────────────────────────────────────────

export const useAddComplexExercises = () =>
  useProgramEdit(
    (db, { complexId, ...dto }: AddComplexExercisesDto & { complexId: number }) => addComplexExercises(db, complexId, dto),
    { successMessage: 'Упражнения добавлены' },
  );

export const useUngroupComplexExercise = () =>
  // Плашку «Отменить» показывает редактор комплекса (useComplexEditing) — тост дублировал бы её
  useProgramEdit((db, id: number) => ungroupComplexExercise(db, id), { skipSuccessToast: true });

export const useUngroupSuperset = () =>
  useProgramEdit(
    (db, { complexId, superset }: { complexId: number; superset: number }) => ungroupSuperset(db, complexId, superset),
    { skipSuccessToast: true },
  );

export const useUpdateComplexExercise = () =>
  // Сохраняется при уходе из поля: новое «3 × 8–12» уже стоит в строке, тост на каждое поле мешал бы
  useProgramEdit(
    (db, { id, ...plan }: UpdateComplexExerciseDto & { id: number }) => updateComplexExercise(db, id, plan),
    { skipSuccessToast: true },
  );

export const useDeleteComplexExercise = () =>
  useProgramEdit((db, id: number) => deleteComplexExercise(db, id), { skipSuccessToast: true });

export const useReorderComplexExercises = () =>
  // Строка сдвигается на глазах — подтверждать нечего
  useProgramEdit(
    (db, { complexId, ids }: { complexId: number; ids: number[] }) => reorderComplexExercises(db, complexId, ids),
    { skipSuccessToast: true },
  );

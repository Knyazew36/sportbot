import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';

import { programKeys } from '@sportbot/api/entities/program';
import type { PublishProgramDto } from '@sportbot/api/generated/model';
import {
  programControllerCopyComplex,
  programControllerDismissUpdate,
  programControllerPublish,
  programControllerResync,
  programControllerShare,
  programControllerUnpublish,
} from '@sportbot/api/generated/program/program';

import { useLocalDb } from '@/shared/db';
import { programs } from '@/shared/db/schema';

// Действия со своей программой, которые делает только сервер: публикация, ссылка, обновление копии,
// копирование комплекса. Программа, созданная без сети, на экране с отрицательным id — серверу нужен его id.
// Результат приедет синком: каждая мутация зовёт requestSync (MutationCache).
// networkMode: 'online' — без сети встают на паузу и доезжают сами, а не падают с ошибкой (локальные
// мутации приложения по умолчанию offlineFirst, см. query-client.ts)

const NOT_SYNCED = 'Программа ещё не дошла до сервера — подключитесь к интернету и повторите';

const useServerProgramId = () => {
  const db = useLocalDb();
  return (id: number): number => {
    if (id > 0) return id;
    const serverId = db?.select({ id: programs.id }).from(programs).where(eq(programs.localId, id)).get()?.id;
    if (!serverId) throw new Error(NOT_SYNCED);
    return serverId;
  };
};

/** «Опубликовать» или «Изменить публикацию»: описание и теги уходят на проверку администратору */
export const usePublishProgram = () => {
  const serverId = useServerProgramId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: PublishProgramDto & { id: number }) => programControllerPublish(serverId(id), body),
    networkMode: 'online',
    meta: { successMessage: 'Отправлено на проверку', inlineFieldErrors: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: programKeys.templates });
      // Новый свой тег мог совпасть с тегом справочника — ряды чипов формы обновятся
      void queryClient.invalidateQueries({ queryKey: programKeys.allTagGroups });
    },
  });
};

export const useUnpublishProgram = () => {
  const serverId = useServerProgramId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => programControllerUnpublish(serverId(id)),
    networkMode: 'online',
    meta: { successMessage: 'Снята с публикации' },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: programKeys.templates }),
  });
};

/** Ссылка «Поделиться» на свою программу */
export const useShareProgram = () => {
  const serverId = useServerProgramId();
  return useMutation({
    mutationFn: (id: number) => programControllerShare(serverId(id)),
    networkMode: 'online',
    // Дальше открывается системное «Поделиться» — оно и есть результат
    meta: { skipSuccessToast: true },
  });
};

/** «Обновить у себя»: копия заменяется версией друга или шаблона, свои правки пропадают */
export const useResyncProgram = () => {
  const serverId = useServerProgramId();
  return useMutation({
    mutationFn: (id: number) => programControllerResync(serverId(id)),
    networkMode: 'online',
    meta: { successMessage: 'Программа обновлена' },
  });
};

/** «Не сейчас» на плашке обновления: вернётся после следующей правки источника */
export const useDismissProgramUpdate = () => {
  const serverId = useServerProgramId();
  return useMutation({
    mutationFn: (id: number) => programControllerDismissUpdate(serverId(id)),
    networkMode: 'online',
    // Плашка исчезнет, когда синк привезёт программу
    meta: { skipSuccessToast: true },
  });
};

/** Копия тренировки из любой видимой программы в конец своей; без programId — в активную */
export const useCopyComplex = () => {
  const serverId = useServerProgramId();
  return useMutation({
    mutationFn: ({ complexId, programId, shareToken }: { complexId: number; shareToken?: string; programId?: number }) => {
      // Источник с отрицательным id — свой комплекс, ещё не дошедший до сервера
      if (complexId < 0) throw new Error(NOT_SYNCED);
      return programControllerCopyComplex(complexId, {
        shareToken,
        programId: programId === undefined ? undefined : serverId(programId),
      });
    },
    networkMode: 'online',
    meta: { successMessage: 'Тренировка скопирована' },
  });
};

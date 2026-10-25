import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { undoBar } from '@/shared/ui/kit/undo-bar';

type Entry<A> = { action: A };

/**
 * Правки одного экрана строго по очереди, часть из них — с отменой. Порт shared/lib/hooks/use-undoable-queue.ts.
 *
 * run/send — правка уходит сразу, но после предыдущих: ответы не обгоняют друг друга и старый не затрёт новый.
 * defer — правка ждёт 3 секунды на плашке «Отменить» (UndoBar) и уходит, когда плашка закрылась (время вышло, смахнули,
 * пришла следующая правка), при уходе с экрана или сворачивании приложения.
 * shown — правки, которых ещё нет в данных сервера (ждут отправки или в пути): экран накладывает их сверху
 * сам, а не через кэш — иначе любой ответ сервера или фоновое обновление вернул бы старую картинку.
 * Из shown правка уходит, когда запрос закончился: к этому моменту её ответ уже в кэше
 */
export const useUndoableQueue = <A>(commit: (action: A) => Promise<unknown>) => {
  const [shown, setShown] = useState<Entry<A>[]>([]);
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const pending = useRef<{ entry: Entry<A>; barId: number } | null>(null);
  const commitRef = useRef(commit);

  useEffect(() => {
    commitRef.current = commit;
  });

  const forget = useCallback((entry: Entry<A>) => setShown((list) => list.filter((e) => e !== entry)), []);

  // Ошибку покажет общий тост мутации; в цепочку она не идёт, чтобы следующие правки не встали
  const enqueue = useCallback(<T>(fn: () => Promise<T>): Promise<T> => {
    const next = chain.current.then(fn);
    chain.current = next.catch(() => undefined);
    return next;
  }, []);

  const flush = useCallback(() => {
    const current = pending.current;
    if (!current) return;
    pending.current = null;
    undoBar.close(current.barId);
    void enqueue(() => commitRef.current(current.entry.action))
      .catch(() => undefined)
      .finally(() => forget(current.entry));
  }, [enqueue, forget]);

  /** Сразу на сервер, но после отложенной правки и всего, что уже в пути. Экран её сверху не накладывает */
  const run = useCallback(
    <T>(fn: () => Promise<T>): Promise<T> => {
      flush();
      return enqueue(fn);
    },
    [enqueue, flush],
  );

  /** Как run, но через commit и с наложением на экран, пока запрос не закончился */
  const send = useCallback(
    (action: A) => {
      flush();
      const entry = { action };
      setShown((list) => [...list, entry]);
      void enqueue(() => commitRef.current(action))
        .catch(() => undefined)
        .finally(() => forget(entry));
    },
    [enqueue, flush, forget],
  );

  /** Через 3 секунды, если не нажали «Отменить» */
  const defer = useCallback(
    (action: A, title: string) => {
      flush();
      const entry = { action };
      const barId = undoBar.show({
        title,
        onUndo: () => {
          pending.current = null;
          forget(entry);
        },
        onClose: () => {
          if (pending.current?.entry === entry) flush();
        },
      });
      pending.current = { entry, barId };
      setShown((list) => [...list, entry]);
    },
    [flush, forget],
  );

  // Ушли с экрана или свернули приложение — отправляем, не дожидаясь плашки: из фона запрос может уже не уйти
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => state !== 'active' && flush());
    return () => {
      sub.remove();
      flush();
    };
  }, [flush]);

  return { run, send, defer, shown: shown.map((e) => e.action) };
};

import { type DefaultError, useMutation, type UseMutationOptions } from '@tanstack/react-query';

/**
 * Мутация базы телефона. Метка local: после неё не нужен pull — правка уже на экране,
 * а в очередь её кладёт сама запись (SyncRunner отправит outbox, когда правки притихнут)
 */
export const useLocalMutation = <TData = unknown, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, DefaultError, TVariables, TContext>,
) => useMutation({ ...options, meta: { ...options.meta, local: true } });

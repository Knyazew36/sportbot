export const renderKeys = {
  all: ['render'] as const,
  /** Без compositionId — файлы всех роликов («Мои файлы») */
  list: (compositionId?: string) => [...renderKeys.all, 'list', compositionId ?? 'all'] as const,
}

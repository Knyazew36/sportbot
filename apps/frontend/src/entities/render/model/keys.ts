export const renderKeys = {
  all: ['render'] as const,
  list: (compositionId: string) => [...renderKeys.all, 'list', compositionId] as const,
}

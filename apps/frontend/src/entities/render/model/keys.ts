export const renderKeys = {
  all: ['render'] as const,
  job: (id: number) => [...renderKeys.all, 'job', id] as const,
}

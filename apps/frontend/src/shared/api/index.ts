// Общий клиент — из пакета @sportbot/api, здесь только то, что есть у веба: кеш с тостами
export * from '@sportbot/api/client'
export { getPersistOptions, queryClient, resumePersistedMutations } from './query-client'
export { apiDomain } from './model/constants'

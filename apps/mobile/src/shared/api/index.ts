// Общий клиент — из пакета @sportbot/api, здесь только то, что есть у мобилки:
// кеш с тостами, персист поверх MMKV и сессионный пользователь
export * from '@sportbot/api/client';
export { bindSessionUser, getPersistOptions, queryClient, resumePersistedMutations } from './query-client';
export { apiDomain } from './model/constants';
export { clearSessionUserId, getSessionUserId, setSessionUserId } from './model/session-user';

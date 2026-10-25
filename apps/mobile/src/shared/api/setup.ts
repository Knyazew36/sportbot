import { configureApi, type ApiLogEntry } from '@sportbot/api/client';

import { apiDomain } from './model/constants';
import { secureTokenStore } from './model/token-store';

// Вебовый log из @front-cmdt/utils печатает %c-формат строками — в консоли RN это мусор,
// поэтому пишем plain. Как и в браузере — только dev: на проде разбираем через Sentry
const log = ({ name, data, type }: ApiLogEntry) => {
  if (!__DEV__) return;
  console.log(`[api:${type}] ${name}`, data);
};

// Подключение общего клиента к мобилке: до первого запроса, поэтому импортируется первым в _layout
configureApi({
  baseURL: apiDomain,
  tokens: secureTokenStore,
  log,
});

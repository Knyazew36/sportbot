// Адрес API без завершающего слэша.
// В dev на телефоне localhost не работает — IP машины в сети или туннель (MOBILE_TZ.md, раздел 3).
// В .env: EXPO_PUBLIC_API_URL=http://192.168.x.x:4003/api
const url = process.env.EXPO_PUBLIC_API_URL;

// Релиз без адреса или с http молча ушёл бы на localhost и не работал бы у пользователей
if (!__DEV__ && !url?.startsWith('https://')) {
  throw new Error('EXPO_PUBLIC_API_URL должен быть https-адресом в релизной сборке');
}

export const apiDomain = url ?? 'http://localhost:4003/api';

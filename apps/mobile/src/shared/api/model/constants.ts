// Адрес API без завершающего слэша.
// В dev на телефоне localhost не работает — IP машины в сети или туннель (MOBILE_TZ.md, раздел 3).
// В .env: EXPO_PUBLIC_API_URL=http://192.168.x.x:4003/api
export const apiDomain = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4003/api';

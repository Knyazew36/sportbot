// Локальная разработка без мессенджера: моковые данные запуска Telegram.
// Сервер в NODE_ENV=development подпись не проверяет (telegram-auth.strategy.ts), на проде этот код не собирается
const STORAGE_KEY = 'dev-tg-user'

/**
 * id моккового пользователя Telegram: ?devUser=123 в адресе (запоминается), иначе VITE_DEV_TG_USER_ID.
 * null — моки выключены
 */
const devUserId = (): string | null => {
  const fromUrl = new URLSearchParams(window.location.search).get('devUser')
  try {
    if (fromUrl) localStorage.setItem(STORAGE_KEY, fromUrl)
    return fromUrl ?? localStorage.getItem(STORAGE_KEY) ?? import.meta.env.VITE_DEV_TG_USER_ID ?? null
  } catch {
    return fromUrl ?? import.meta.env.VITE_DEV_TG_USER_ID ?? null
  }
}

/** Строка initData в формате Telegram: поля как у настоящей, подпись фиктивная */
export const devTelegramInitData = (): string | null => {
  if (!import.meta.env.DEV) return null
  const id = devUserId()
  if (!id) return null

  const user = {
    id: Number(id),
    first_name: `Dev ${id}`,
    username: `dev_${id}`,
    language_code: 'ru',
    allows_write_to_pm: true,
  }
  return new URLSearchParams({
    user: JSON.stringify(user),
    auth_date: String(Math.floor(Date.now() / 1000)),
    hash: 'dev',
    signature: 'dev',
  }).toString()
}

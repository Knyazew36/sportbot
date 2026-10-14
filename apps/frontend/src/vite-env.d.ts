/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_BOT_URL?: string
  /** Только dev: id мокового пользователя Telegram для входа в Mini App из браузера */
  readonly VITE_DEV_TG_USER_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

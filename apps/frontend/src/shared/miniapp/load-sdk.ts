export type SdkPlatform = 'telegram' | 'max'

const SDK_URL: Record<SdkPlatform, string> = {
  telegram: 'https://telegram.org/js/telegram-web-app.js',
  max: 'https://st.max.ru/js/max-web-app.js',
}

// Дольше не ждём: приложение должно стартовать и при недоступном CDN мессенджера
const TIMEOUT_MS = 5000

export const loadSdk = (platform: SdkPlatform): Promise<void> =>
  new Promise((resolve, reject) => {
    const src = SDK_URL[platform]
    const script = document.createElement('script')
    const timer = window.setTimeout(() => reject(new Error(`SDK не загрузился за ${TIMEOUT_MS} мс: ${src}`)), TIMEOUT_MS)

    script.src = src
    script.onload = () => {
      window.clearTimeout(timer)
      resolve()
    }
    script.onerror = () => {
      window.clearTimeout(timer)
      reject(new Error(`SDK не загрузился: ${src}`))
    }
    document.head.append(script)
  })

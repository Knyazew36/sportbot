# Спортбот — мобильное приложение

Expo (React Native) + expo-router. Порт Mini App из `apps/frontend`, план и статус переноса — в [MOBILE_TZ.md](./MOBILE_TZ.md).

Expo Go не подходит: в проекте нативные модули (mmkv, uniwind, notifications). Нужна своя сборка — dev-клиент или release APK.

## Что нужно на компьютере

- Node.js и зависимости монорепо: `yarn` в корне репозитория.
- Java 21 и Android SDK (Android Studio), переменная `ANDROID_HOME`.
- `adb` — из `$ANDROID_HOME/platform-tools`.

## Адрес API

`apps/mobile/.env` (образец — `.env.example`):

```
EXPO_PUBLIC_API_URL=https://<прод-домен>/api   # прод — тот же, что VITE_API_URL фронта
# EXPO_PUBLIC_API_URL=http://10.0.2.2:4003/api # эмулятор → сервер на этом ПК
# EXPO_PUBLIC_API_URL=http://192.168.x.x:4003/api # телефон → сервер на этом ПК по Wi-Fi
```

`EXPO_PUBLIC_*` вшивается в бандл. После правки `.env` — перезапуск Metro с `-c`, в release APK — пересборка.

> Сборка, смотрящая на прод, работает с боевыми данными: тренировки, профиль, удаление аккаунта — всё по-настоящему.

## Dev-сборка: правки видны сразу

Dev-клиент содержит только нативную часть, JS он берёт с Metro на компьютере. Правки в `src/` прилетают на телефон за секунду (Fast Refresh). Без запущенного Metro приложение не откроется.

### 1. Подключить телефон (один раз)

1. Настройки → Сведения о телефоне → Сведения о ПО → 7 раз нажать «Номер сборки».
2. Параметры разработчика → «Отладка по USB».
3. Кабель **с передачей данных** (не только зарядка), на телефоне разрешить отладку.
4. Проверить: `adb devices` — телефон в статусе `device`. Статус `offline` или телефона нет — другой кабель или порт.

### 2. Собрать и поставить dev-клиент

Нужно в первый раз и после каждого изменения нативной части (см. «Когда пересобирать»).

```bash
cd apps/mobile/android
./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a
adb -d install -r app/build/outputs/apk/debug/app-debug.apk
```

`arm64-v8a` — для телефона. APK под эмулятор (x86_64) на телефон не встанет: `INSTALL_FAILED_NO_MATCHING_ABIS`. Под эмулятор: `-PreactNativeArchitectures=x86_64` или просто `yarn android`.

`-d` — установить на телефон по USB, если подключён ещё и эмулятор.

### 3. Запустить Metro

```bash
cd apps/mobile
npx expo start --dev-client -c
```

Подключить телефон к Metro — один из способов:

- **USB (надёжнее всего):**
  ```bash
  adb -d reverse tcp:8081 tcp:8081
  ```
  В «Спортбот Dev» выбрать `http://localhost:8081`. `adb reverse` сбрасывается при переподключении кабеля или перезапуске adb — повторить.

- **Wi-Fi:** телефон и ПК в одной сети (стационарный ПК кабелем в тот же роутер — тоже подходит; гостевая сеть — нет). Сканировать QR из терминала. Если висит «Connecting to the development server» — Windows не пускает входящие на 8081. В PowerShell от администратора:
  ```powershell
  New-NetFirewallRule -DisplayName "Metro 8081" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow -Profile Private
  ```
  и сеть в Windows должна быть «Частная».

- **Туннель через интернет** (любая сеть, медленнее): `npx expo start --dev-client --tunnel`.

Открыть приложение на нужном Metro прямо с ПК:

```bash
adb -d shell am start -a android.intent.action.VIEW -d "exp+sportbot://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" ru.sportbot.app.dev
```

## Когда пересобирать

| Что поменялось | Что сделать |
| --- | --- |
| Код в `src/`, стили, тексты | Ничего — Fast Refresh |
| `.env` | Перезапустить Metro: `npx expo start --dev-client -c` |
| Новый нативный пакет (`expo-image-picker` и т. п.), `app.config.ts` (иконка, имя, плагины) | `npx expo prebuild`, затем пересобрать и поставить dev-клиент (шаг 2) |
| Странное поведение после смены веток | `npx expo prebuild --clean` и пересборка |

## Release APK: без компьютера

JS и адрес API вшиты внутрь, Metro не нужен — ставится как обычное приложение. Правки сразу не видны: после каждой — пересборка.

```bash
cd apps/mobile/android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
adb -d install -r app/build/outputs/apk/release/app-release.apk
```

Или перекинуть `app-release.apk` на телефон (Telegram, USB) и установить, разрешив «неизвестные источники».

- Подписан debug-ключом: для своего телефона достаточно, для Google Play — нет.
- Release Android по умолчанию не пускает `http://` — адрес API должен быть `https` (прод).

## Варианты приложения

`APP_VARIANT` (по умолчанию `development`) задаёт имя и id пакета, см. `app.config.ts`:

| Вариант | Имя | Пакет |
| --- | --- | --- |
| `development` | Спортбот Dev | `ru.sportbot.app.dev` |
| `preview` | Спортбот Preview | `ru.sportbot.app.preview` |
| `production` | Спортбот | `ru.sportbot.app` |

Папка `android/` генерируется под вариант. Сменить: `APP_VARIANT=preview npx expo prebuild --clean`, затем сборка. Варианты ставятся рядом, не заменяя друг друга.

## Проверки

```bash
yarn check-types   # tsc
yarn lint          # expo lint
```

## Частые проблемы

- **`adb devices` пусто или `offline`** — кабель только для зарядки, плохой порт или хаб; на телефоне «Отозвать авторизацию отладки по USB» и подключить заново.
- **`INSTALL_FAILED_NO_MATCHING_ABIS`** — APK собран под эмулятор, пересобрать с `arm64-v8a`.
- **Бесконечное «Connecting to the development server»** — Wi-Fi и брандмауэр, см. выше; либо USB + `adb reverse`.
- **Старый адрес API** — Metro запущен до правки `.env`: перезапустить с `-c`.
- **iOS** — без Mac только облачная сборка EAS и аккаунт Apple Developer.

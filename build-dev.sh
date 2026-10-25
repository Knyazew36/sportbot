#!/usr/bin/env bash
# Пересборка dev-клиента «Спортбот Dev» после изменений нативной части (новый пакет, app.config.ts).
#
#   yarn mobile:dev              # prebuild → сборка → установка на телефон по USB → adb reverse
#   yarn mobile:dev --clean      # android/ с нуля: после смены веток или если модуль всё равно «не найден»
#   yarn mobile:dev --no-install # только собрать APK
#
# JS не вшивается: после установки нужен запущенный Metro (yarn start в apps/mobile).
set -euo pipefail

CLEAN=""
INSTALL=1
for arg in "$@"; do
  case "$arg" in
    --clean) CLEAN="--clean" ;;
    --no-install) INSTALL=0 ;;
    *)
      echo "Неизвестный флаг: $arg (есть --clean, --no-install)" >&2
      exit 1
      ;;
  esac
done

ROOT="$(cd "$(dirname "$0")" && pwd)"
MOBILE="$ROOT/apps/mobile"
APK="$MOBILE/android/app/build/outputs/apk/debug/app-debug.apk"
PACKAGE="ru.sportbot.app.dev"

# platform-tools часто не в PATH, хотя SDK стоит: берём adb из ANDROID_HOME или стандартного места
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-${LOCALAPPDATA:-}/Android/Sdk}}"
if command -v cygpath >/dev/null && [[ -n "$SDK" ]]; then
  SDK="$(cygpath -u "$SDK")"
fi
if [[ -d "$SDK/platform-tools" ]]; then
  export PATH="$SDK/platform-tools:$PATH"
fi

# Телефон проверяем до сборки, а не после нескольких минут gradle
if [[ "$INSTALL" == 1 ]]; then
  if ! command -v adb >/dev/null; then
    echo "adb не найден: нет в PATH и в $SDK/platform-tools (задать ANDROID_HOME)" >&2
    exit 1
  fi
  if ! adb -d get-state >/dev/null 2>&1; then
    echo "Телефон по USB не найден: adb devices должен показать его в статусе device." >&2
    echo "Собрать без установки: yarn mobile:dev --no-install" >&2
    exit 1
  fi
fi

# Без --clean prebuild только дописывает изменения: быстрее, gradle-кэш остаётся
echo "→ Генерирую android/ под development ${CLEAN}"
(cd "$MOBILE" && APP_VARIANT=development npx expo prebuild --platform android --no-install $CLEAN)

# arm64-v8a — телефон; под эмулятор такой APK не встанет (INSTALL_FAILED_NO_MATCHING_ABIS)
echo "→ Собираю debug APK"
(cd "$MOBILE/android" && APP_VARIANT=development ./gradlew assembleDebug \
  -PreactNativeArchitectures=arm64-v8a --console=plain)

if [[ "$INSTALL" == 0 ]]; then
  echo
  echo "✓ Собрано: ${APK#"$ROOT/"}"
  exit 0
fi

echo "→ Ставлю на телефон"
adb -d install -r "$APK"

# Metro по USB: телефон ходит на localhost:8081 ПК, брандмауэр и Wi-Fi не мешают
adb -d reverse tcp:8081 tcp:8081 >/dev/null

echo "→ Открываю приложение на localhost:8081"
adb -d shell am start -a android.intent.action.VIEW \
  -d "exp+sportbot://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" "$PACKAGE" >/dev/null

echo
echo "✓ Готово. Если Metro не запущен: cd apps/mobile && yarn start"

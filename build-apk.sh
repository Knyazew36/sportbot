#!/usr/bin/env bash
# Release APK мобилки, который можно скинуть и поставить без компьютера: JS и адрес API вшиты внутрь.
#
#   yarn mobile:apk                  # вариант preview → dist/apk/sportbot-preview-….apk
#   yarn mobile:apk production       # «Спортбот», пакет ru.sportbot.app
#   yarn mobile:apk preview --keep   # не возвращать android/ к dev-клиенту после сборки
#
# Preview и production — другие id пакета, поэтому ставятся рядом с dev-клиентом, а не поверх него.
# android/ генерируется под вариант, после сборки скрипт перегенерирует его обратно под development.
set -euo pipefail

VARIANT="${1:-preview}"
KEEP="${2:-}"
ROOT="$(cd "$(dirname "$0")" && pwd)"
MOBILE="$ROOT/apps/mobile"
OUT="$ROOT/dist/apk"

case "$VARIANT" in
  preview | production) ;;
  *)
    echo "Вариант: preview или production (development — это dev-клиент, см. apps/mobile/README.md)" >&2
    exit 1
    ;;
esac

# Адрес API вшивается при сборке. Release Android не пускает http:// — сразу останавливаемся, а не после 5 минут сборки.
# Сам адрес не печатаем: только проверяем схему
API_URL="$(grep -E '^EXPO_PUBLIC_API_URL=' "$MOBILE/.env" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '"'"'"' \r' || true)"
if [[ -z "$API_URL" ]]; then
  echo "Нет EXPO_PUBLIC_API_URL в apps/mobile/.env" >&2
  exit 1
fi
if [[ "$API_URL" != https://* ]]; then
  echo "EXPO_PUBLIC_API_URL должен быть https:// — release-сборка Android не ходит по http" >&2
  exit 1
fi

# prebuild --clean не спрашивает про незакоммиченные файлы и не ждёт ввода
export EXPO_NO_GIT_STATUS=1 CI=1

prebuild() {
  (cd "$MOBILE" && APP_VARIANT="$1" npx expo prebuild --platform android --clean --no-install)
}

restore() {
  if [[ "$KEEP" != "--keep" ]]; then
    echo "→ Возвращаю android/ под dev-клиент"
    prebuild development
  fi
}
trap restore EXIT

echo "→ Генерирую android/ под $VARIANT"
prebuild "$VARIANT"

# arm64 — современные телефоны, armeabi-v7a — старые: APK должен встать на любой телефон, которому его скинут
echo "→ Собираю release APK (несколько минут)"
(cd "$MOBILE/android" && APP_VARIANT="$VARIANT" ./gradlew assembleRelease \
  -PreactNativeArchitectures=arm64-v8a,armeabi-v7a --console=plain)

VERSION="$(node -p "require('$MOBILE/package.json').version" 2>/dev/null || echo 1.0.0)"
NAME="sportbot-$VARIANT-$VERSION-$(date +%Y%m%d-%H%M).apk"
mkdir -p "$OUT"
cp "$MOBILE/android/app/build/outputs/apk/release/app-release.apk" "$OUT/$NAME"

echo
echo "✓ Готово: dist/apk/$NAME"
echo "  Поставить по USB: adb -d install -r \"dist/apk/$NAME\""
echo "  Или скинуть файл на телефон и открыть (разрешить установку из неизвестных источников)"

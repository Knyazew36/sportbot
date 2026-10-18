#!/usr/bin/env bash
# ffmpeg 8 с x265, собранным с альфой, — для формата mov-hevc-alpha (HEVC с альфой, родной для iPhone).
# Готовые сборки ffmpeg везут x265 без ENABLE_ALPHA: ошибка «Loaded libx265 does not support alpha layer encoding».
#
# Вызывается из deploy.sh на каждом деплое: уже собранный и рабочий ffmpeg не пересобирается, первая сборка ~10–20 мин.
# Ставится рядом с сервером (apps/server/.ffmpeg-alpha), не трогая системный ffmpeg; воркер берёт путь из FFMPEG_ALPHA_PATH
set -euo pipefail

SERVER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PREFIX="${PREFIX:-${SERVER_DIR}/.ffmpeg-alpha}"
X265_TAG="${X265_TAG:-4.1}"
FFMPEG_TAG="${FFMPEG_TAG:-n8.0}"

# Путь воркера целиком: кадр с полупрозрачностью → PNG-в-MOV (как отдаёт Remotion) → HEVC с альфой.
# PNG проверяем отдельно: без zlib ffmpeg молча собирается без него («no decoder found for: png»)
alpha_works() {
  local check ok=0
  check="$(mktemp -d)"
  "${PREFIX}/bin/ffmpeg" -hide_banner -loglevel error -y \
    -f lavfi -i "color=c=red@0.5:s=320x240:d=1,format=rgba" \
    -c:v png -pix_fmt rgba "${check}/src.mov" &&
    "${PREFIX}/bin/ffmpeg" -hide_banner -loglevel error -y -i "${check}/src.mov" \
      -c:v libx265 -pix_fmt yuva420p -tag:v hvc1 "${check}/alpha.mov" &&
    [ -s "${check}/alpha.mov" ] || ok=1
  rm -rf "${check}"
  return ${ok}
}

if [ -x "${PREFIX}/bin/ffmpeg" ] && alpha_works; then
  echo "🎞️ ffmpeg с альфой уже собран: ${PREFIX}/bin/ffmpeg"
  exit 0
fi

# Инструменты сборки: ставим, только если чего-то нет — sudo на каждом деплое не нужен
missing=()
for tool in cmake nasm pkg-config git make g++; do
  command -v "${tool}" >/dev/null || missing+=("${tool}")
done
# zlib — для PNG-кадров, которые отдаёт Remotion
pkg-config --exists zlib 2>/dev/null || missing+=("zlib")
if [ ${#missing[@]} -gt 0 ]; then
  echo "📦 Нет инструментов сборки: ${missing[*]}"
  SUDO=""
  [ "$(id -u)" -ne 0 ] && SUDO="sudo"
  ${SUDO} apt-get update
  ${SUDO} apt-get install -y build-essential cmake nasm pkg-config git zlib1g-dev
fi

BUILD="$(mktemp -d)"
trap 'rm -rf "${BUILD}"' EXIT
JOBS="$(nproc)"

echo "🎞️ x265 ${X265_TAG} с альфой"
git clone --depth 1 --branch "${X265_TAG}" https://bitbucket.org/multicoreware/x265_git.git "${BUILD}/x265"
mkdir -p "${BUILD}/x265/build/linux"
(
  cd "${BUILD}/x265/build/linux"
  cmake -G "Unix Makefiles" ../../source \
    -DCMAKE_INSTALL_PREFIX="${PREFIX}" \
    -DENABLE_SHARED=OFF \
    -DENABLE_CLI=OFF \
    -DENABLE_ALPHA=ON
  make -j"${JOBS}"
  make install
)

echo "🎬 ffmpeg ${FFMPEG_TAG}"
git clone --depth 1 --branch "${FFMPEG_TAG}" https://github.com/FFmpeg/FFmpeg.git "${BUILD}/ffmpeg"
(
  cd "${BUILD}/ffmpeg"
  PKG_CONFIG_PATH="${PREFIX}/lib/pkgconfig" ./configure \
    --prefix="${PREFIX}" \
    --pkg-config-flags="--static" \
    --extra-cflags="-I${PREFIX}/include" \
    --extra-ldflags="-L${PREFIX}/lib" \
    --extra-libs="-lpthread -lm -lstdc++ -ldl" \
    --enable-gpl \
    --enable-libx265 \
    --enable-zlib \
    --disable-doc \
    --disable-ffplay
  make -j"${JOBS}"
  make install
)

if ! alpha_works; then
  echo "❌ ffmpeg собран, но HEVC с альфой не кодирует" >&2
  exit 1
fi
echo "✅ ffmpeg с альфой: ${PREFIX}/bin/ffmpeg"

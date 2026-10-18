#!/usr/bin/env bash
# ffmpeg 8 с x265, собранным с альфой, — для формата mov-hevc-alpha (HEVC с альфой, родной для iPhone).
# Готовые сборки ffmpeg везут x265 без ENABLE_ALPHA: ошибка «Loaded libx265 does not support alpha layer encoding».
# Ставится отдельно от системного ffmpeg, в /opt/ffmpeg-alpha; воркер берёт путь из FFMPEG_ALPHA_PATH.
#
# Запуск на сервере (Ubuntu/Debian), один раз, ~10–20 мин:
#   sudo bash apps/server/scripts/build-ffmpeg-alpha.sh
set -euo pipefail

PREFIX="${PREFIX:-/opt/ffmpeg-alpha}"
X265_TAG="${X265_TAG:-4.1}"
FFMPEG_TAG="${FFMPEG_TAG:-n8.0}"
BUILD="$(mktemp -d)"
JOBS="$(nproc)"

echo "📦 Зависимости сборки"
apt-get update
apt-get install -y build-essential cmake nasm pkg-config git

echo "🎞️ x265 ${X265_TAG} с альфой"
git clone --depth 1 --branch "${X265_TAG}" https://bitbucket.org/multicoreware/x265_git.git "${BUILD}/x265"
mkdir -p "${BUILD}/x265/build/linux"
cd "${BUILD}/x265/build/linux"
cmake -G "Unix Makefiles" ../../source \
  -DCMAKE_INSTALL_PREFIX="${PREFIX}" \
  -DENABLE_SHARED=OFF \
  -DENABLE_CLI=OFF \
  -DENABLE_ALPHA=ON
make -j"${JOBS}"
make install

echo "🎬 ffmpeg ${FFMPEG_TAG}"
git clone --depth 1 --branch "${FFMPEG_TAG}" https://github.com/FFmpeg/FFmpeg.git "${BUILD}/ffmpeg"
cd "${BUILD}/ffmpeg"
PKG_CONFIG_PATH="${PREFIX}/lib/pkgconfig" ./configure \
  --prefix="${PREFIX}" \
  --pkg-config-flags="--static" \
  --extra-cflags="-I${PREFIX}/include" \
  --extra-ldflags="-L${PREFIX}/lib" \
  --extra-libs="-lpthread -lm -lstdc++ -ldl" \
  --enable-gpl \
  --enable-libx265 \
  --disable-doc \
  --disable-ffplay
make -j"${JOBS}"
make install

rm -rf "${BUILD}"

echo "✅ Проверка: кадр с полупрозрачностью → HEVC с альфой"
CHECK="$(mktemp -d)"
"${PREFIX}/bin/ffmpeg" -hide_banner -loglevel error -y \
  -f lavfi -i "color=c=red@0.5:s=320x240:d=1,format=rgba" \
  -c:v libx265 -pix_fmt yuva420p -tag:v hvc1 "${CHECK}/alpha.mov"
ls -la "${CHECK}/alpha.mov"
rm -rf "${CHECK}"

echo "Готово: ${PREFIX}/bin/ffmpeg. В .env сервера: FFMPEG_ALPHA_PATH=${PREFIX}/bin/ffmpeg (это и так значение по умолчанию)"

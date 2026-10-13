#!/bin/bash
set -e

# Наполнение справочника: мышцы и суставы (сид) + упражнения, растяжки, шаблоны (catalog.json).
# Повторный запуск безопасен: записи обновляются по code, уже скачанные картинки не качаются заново.
# Запуск: ./content.sh [--no-images] [путь/к/файлу.json]
# --no-images — без скачивания картинок: только текст, мышцы, суставы, шаблоны.

cd "$(dirname "$0")"

echo "⚙️ Generating Prisma client..."
npx prisma generate

echo "🌱 Seeding muscles and joints..."
npx prisma db seed

echo "📥 Importing catalog..."
yarn content:import "$@"

echo "✅ Catalog is ready!"

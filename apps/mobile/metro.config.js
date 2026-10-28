// Learn more: https://docs.expo.dev/guides/customizing-metro/
// expo/metro-config с SDK 52+ сам определяет монорепо: watchFolders и
// nodeModulesPaths настраивать вручную не нужно (см. docs.expo.dev/guides/monorepos).
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Миграции drizzle — .sql-файлы, babel встраивает их строками (inline-import в babel.config.js)
config.resolver.sourceExts.push('sql');

// drizzle-orm поднят в корневой node_modules и оттуда нашёл бы корневую копию expo-sqlite,
// которой не хватает expo-modules-core (он есть только в apps/mobile) — приложение упало бы на старте.
// Все импорты expo-sqlite — из копии мобилки
const ownPackage = path.join(__dirname, 'package.json');
const resolveDefault = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = resolveDefault ?? context.resolveRequest;
  if (moduleName === 'expo-sqlite' || moduleName.startsWith('expo-sqlite/')) {
    return resolve({ ...context, originModulePath: ownPackage }, moduleName, platform);
  }
  return resolve(context, moduleName, platform);
};

// Uniwind — внешняя обёртка (требование библиотеки). Темы light/dark — синяя палитра, rose-* — розовая
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
  extraThemes: ['rose-light', 'rose-dark'],
  // rem как в вебе: px-4, text-base и прочие rem-классы совпадают с фронтом
  polyfills: { rem: 16 },
});

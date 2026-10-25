// Learn more: https://docs.expo.dev/guides/customizing-metro/
// expo/metro-config с SDK 52+ сам определяет монорепо: watchFolders и
// nodeModulesPaths настраивать вручную не нужно (см. docs.expo.dev/guides/monorepos).
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Uniwind — внешняя обёртка (требование библиотеки). Темы light/dark — синяя палитра, rose-* — розовая
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
  extraThemes: ['rose-light', 'rose-dark'],
  // rem как в вебе: px-4, text-base и прочие rem-классы совпадают с фронтом
  polyfills: { rem: 16 },
});

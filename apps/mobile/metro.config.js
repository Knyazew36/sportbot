// Learn more: https://docs.expo.dev/guides/customizing-metro/
// expo/metro-config с SDK 52+ сам определяет монорепо: watchFolders и
// nodeModulesPaths настраивать вручную не нужно (см. docs.expo.dev/guides/monorepos).
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;

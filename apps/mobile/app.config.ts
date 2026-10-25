import type { ConfigContext, ExpoConfig } from 'expo/config';

type AppVariant = 'development' | 'preview' | 'production';

const variant = (process.env.APP_VARIANT ?? 'development') as AppVariant;

const variants: Record<AppVariant, { name: string; bundleId: string }> = {
  development: { name: 'Спортбот Dev', bundleId: 'ru.sportbot.app.dev' },
  preview: { name: 'Спортбот Preview', bundleId: 'ru.sportbot.app.preview' },
  production: { name: 'Спортбот', bundleId: 'ru.sportbot.app' },
};

// EXPO_PUBLIC_API_URL подставляется Expo из .env автоматически.
// APP_VARIANT задаётся в eas.json (профили) или перед запуском: APP_VARIANT=preview npx expo start.
export default ({ config }: ConfigContext): ExpoConfig => {
  const app = variants[variant];

  return {
    ...config,
    name: app.name,
    slug: 'sportbot',
    scheme: 'sportbot',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    icon: './assets/images/icon.png',
    ios: {
      ...config.ios,
      bundleIdentifier: app.bundleId,
      supportsTablet: false,
    },
    android: {
      ...config.android,
      package: app.bundleId,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#fff8f1',
      },
      predictiveBackGestureEnabled: false,
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#fff8f1',
          image: './assets/images/splash-icon.png',
          imageWidth: 128,
          dark: { backgroundColor: '#070d1a' },
        },
      ],
      // Фото профиля из галереи: камеру и микрофон не просим — приложение получает только выбранный снимок
      [
        'expo-image-picker',
        {
          photosPermission: 'Фото нужно для аватара в профиле',
          cameraPermission: false,
          microphonePermission: false,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};

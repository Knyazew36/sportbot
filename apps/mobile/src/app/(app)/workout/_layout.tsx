import { Stack } from 'expo-router';

// Тренировка — полноэкранный стек поверх табов (MOBILE_TZ.md, карта маршрутов)
export default function LayoutWorkout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

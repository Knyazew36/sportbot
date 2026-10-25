import { Stack } from 'expo-router';

// Стек внутри таба: вложенные экраны раздела открываются поверх его списка, меню остаётся
export default function LayoutTabStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

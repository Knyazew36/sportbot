import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { BookOpen, ChartNoAxesColumn, Layers, Target, UserRound } from 'lucide-react-native';

import { Eyebrow } from '@/shared/ui/kit/Typography';
import { useTheme } from '@/shared/theme/ThemeProvider';

// Нижнее меню: Сегодня, Программы, Библиотека, Статистика, Профиль (frontend-tz, раздел 6).
// Тренировка открывается поверх табов полноэкранно — в (app)/_layout
export default function LayoutTabs() {
  const { colors } = useTheme();

  const screenOptions = {
    headerShown: false,
    tabBarActiveTintColor: colors.blue,
    tabBarInactiveTintColor: colors.smoke,
    tabBarStyle: {
      backgroundColor: colors.paper,
      borderTopWidth: 1.5,
      borderTopColor: colors.rule,
      height: 66,
    },
    tabBarLabel: ({ children, color }: { children: string; color: ColorValue }) => (
      <Eyebrow size="sm" style={{ color }}>
        {children}
      </Eyebrow>
    ),
  } as const;

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="today" options={{ title: 'Сегодня', tabBarIcon: ({ color }) => <Target color={color} size={22} /> }} />
      <Tabs.Screen name="programs" options={{ title: 'Программы', tabBarIcon: ({ color }) => <Layers color={color} size={22} /> }} />
      <Tabs.Screen name="library" options={{ title: 'Библиотека', tabBarIcon: ({ color }) => <BookOpen color={color} size={22} /> }} />
      <Tabs.Screen name="stats" options={{ title: 'Статистика', tabBarIcon: ({ color }) => <ChartNoAxesColumn color={color} size={22} /> }} />
      <Tabs.Screen name="me" options={{ title: 'Профиль', tabBarIcon: ({ color }) => <UserRound color={color} size={22} /> }} />
    </Tabs>
  );
}

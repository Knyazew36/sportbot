import { router, useLocalSearchParams } from 'expo-router';

export const TABS = [
  { value: 'progress', label: 'Прогресс' },
  { value: 'muscles', label: 'Мышцы' },
  { value: 'attendance', label: 'Посещения' },
] as const;

type Tab = (typeof TABS)[number]['value'];

export const useTab = () => {
  const { tab: raw } = useLocalSearchParams<{ tab?: string }>();
  const tab: Tab = TABS.find((item) => item.value === raw)?.value ?? 'progress';
  const setTab = (next: Tab) => router.setParams({ tab: next });
  return [tab, setTab] as const;
};

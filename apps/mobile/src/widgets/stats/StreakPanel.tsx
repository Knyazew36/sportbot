import { View } from 'react-native';

import { InkPanel } from '@/shared/ui/kit/InkPanel';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Lead, Poster, Suffix } from '@/shared/ui/kit/Typography';

// Серия и рекорд на чёрной плашке — порт widgets/stats/StreakPanel.tsx: главный мотиватор статистики
type StreakPanelProps = { current: number; record: number; className?: string };

export const StreakPanel = ({ current, record, className = 'px-gutter' }: StreakPanelProps) => (
  <Rise className={className}>
    <InkPanel className="p-4">
      <View className="flex-row items-end justify-between">
        <View>
          <Eyebrow tone="inverseMuted">Серия сейчас</Eyebrow>
          <Poster size="5xl" numeric className="mt-2">
            {String(current)}
          </Poster>
        </View>
        <View className="items-end">
          <Eyebrow tone="inverseMuted">Рекорд</Eyebrow>
          <Poster size="5xl" numeric tone="primary" className="mt-2">
            {String(record)}
          </Poster>
        </View>
      </View>
    </InkPanel>
  </Rise>
);

// Посещаемость: месяц крупно, неделя рядом
type AttendanceProps = {
  month: number;
  week: number;
  weekNote: string;
  /** Подпись над цифрами; null — у блока уже есть своя шапка */
  label?: string | null;
  className?: string;
};

export const Attendance = ({ month, week, weekNote, label = 'посещаемость', className = 'px-gutter' }: AttendanceProps) => (
  <Rise className={className}>
    {label ? <Lead>{label}</Lead> : null}
    <View className="mt-2 flex-row items-end">
      <View className="flex-1">
        <Poster size="display" tone="primary">
          {month}
          <Suffix>%</Suffix>
        </Poster>
        <Eyebrow className="mt-2">за месяц</Eyebrow>
      </View>
      <View className="border-border flex-1 border-l-[1.5px] pl-4">
        <Poster size="4xl" fit>
          {week}
          <Suffix>%</Suffix>
        </Poster>
        <Eyebrow className="mt-2">за неделю · {weekNote}</Eyebrow>
      </View>
    </View>
  </Rise>
);

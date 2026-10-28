import type { ReactNode } from 'react';
import { View } from 'react-native';

import type { CatalogExercise } from '@sportbot/api/entities/catalog';
import { useLimitations } from '@/shared/local/entities/profile';

import { Badge } from '@/shared/ui/kit/Badge';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';

const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <View className="gap-2">
    <Eyebrow>{title}</Eyebrow>
    <View className="flex-row flex-wrap gap-1.5">{children}</View>
  </View>
);

// Мышцы и суставы. Суставы, на которые у пользователя действует ограничение, подсвечены.
// Сетку «подпись — значение» фронта в RN заменяют группы друг под другом: на узком экране подписи длинные
export const ExerciseMuscles = ({ exercise: e }: { exercise: CatalogExercise }) => {
  const limitations = useLimitations();
  const limited = new Set(limitations.data?.map((l) => l.jointId));

  return (
    <ScreenSection>
      <Eyebrow tone="primary">Мышцы</Eyebrow>
      <Group title="Основные">
        {e.primaryMuscles.map((m) => (
          <Badge key={m.id}>{m.name}</Badge>
        ))}
      </Group>
      {e.secondaryMuscles.length > 0 && (
        <Group title="Помогают">
          {e.secondaryMuscles.map((m) => (
            <Badge key={m.id} variant="outline">
              {m.name}
            </Badge>
          ))}
        </Group>
      )}
      {e.joints.length > 0 && (
        <Group title="Суставы под нагрузкой">
          {e.joints.map((j) => (
            <Badge key={j.id} variant={limited.has(j.id) ? 'destructive' : 'outline'}>
              {limited.has(j.id) ? `⚠ ${j.name}` : j.name}
            </Badge>
          ))}
        </Group>
      )}
      {e.joints.some((j) => limited.has(j.id)) && (
        <Text size="sm" tone="danger">
          Нагружает сустав, на котором у тебя ограничение.
        </Text>
      )}
    </ScreenSection>
  );
};

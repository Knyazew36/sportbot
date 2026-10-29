import type { ReactNode } from 'react';
import { View } from 'react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { complexLetter, type ProgramComplex } from '@sportbot/api/entities/program';

import { SET_FORMS } from '@/shared/lib/plural-forms';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { StateView } from '@/shared/ui/kit/StateView';
import { Text } from '@/shared/ui/kit/Typography';

import { ComplexPlanList } from './ComplexPlanList';

export type PreviewProgram = {
  name: string;
  description?: string | null;
  complexes: ProgramComplex[];
};

type ProgramPreviewSheetProps = {
  program: PreviewProgram | null;
  onOpenChange: (open: boolean) => void;
  note?: ReactNode;
  action?: ReactNode;
  /** Состав ещё грузится: шторка уже открыта по строке списка, комплексы подъедут */
  loading?: boolean;
};

// Состав программы без ухода с экрана — порт widgets/program-preview/ProgramPreviewSheet.tsx: шаблон на шаге
// онбординга, программа друга в его профиле. Данные приносит вызывающий — шторка ничего не запрашивает
export const ProgramPreviewSheet = ({ program, onOpenChange, note, action, loading }: ProgramPreviewSheetProps) => (
  <Sheet
    fullHeight
    open={program != null}
    onOpenChange={onOpenChange}
    title={program?.name ?? 'Программа'}
    description={program?.description || 'Тренировки идут по очереди, по кругу.'}
    footer={action}
  >
    <View className="gap-8 pb-2">
      {loading && <StateView state="loading" />}
      {!loading && program && program.complexes.length === 0 && <Text tone="muted">Тренировок пока нет.</Text>}
      {program?.complexes.map((c, i) => (
        // Дни идут подряд и однотипны — без жирной шапки сливаются в один список.
        // Поля уже даёт шторка, поэтому у секции свои отключены
        <ScreenSection
          key={c.id}
          variant="block"
          className="px-0"
          title={`${complexLetter(i)} · ${c.name}`}
          aside={pluralize(
            c.exercises.reduce((sum, e) => sum + e.sets, 0),
            SET_FORMS,
          )}
        >
          <ComplexPlanList complex={c} />
        </ScreenSection>
      ))}
      {note ? (
        <Text size="xs" tone="muted">
          {note}
        </Text>
      ) : null}
    </View>
  </Sheet>
);

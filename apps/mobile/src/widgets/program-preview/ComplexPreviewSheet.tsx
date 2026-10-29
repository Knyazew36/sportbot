import type { ReactNode } from 'react';

import type { ProgramComplex } from '@sportbot/api/entities/program';

import { Sheet } from '@/shared/ui/kit/Sheet';
import { StateView } from '@/shared/ui/kit/StateView';
import { Text } from '@/shared/ui/kit/Typography';

import { ComplexPlanList } from './ComplexPlanList';

type ComplexPreviewSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Шапка известна сразу — из строки, по которой открыли, пока состав грузится */
  title: string;
  description?: ReactNode;
  complex: ProgramComplex | undefined;
  loading?: boolean;
};

// Состав одной тренировки без ухода с экрана — порт widgets/program-preview/ComplexPreviewSheet.tsx.
// Данные приносит вызывающий — шторка ничего не запрашивает
export const ComplexPreviewSheet = ({
  open,
  onOpenChange,
  title,
  description,
  complex,
  loading,
}: ComplexPreviewSheetProps) => (
  <Sheet fullHeight open={open} onOpenChange={onOpenChange} title={title} description={description}>
    {loading && <StateView state="loading" />}
    {!loading && complex && complex.exercises.length === 0 && (
      <Text tone="muted">В тренировке пока нет упражнений.</Text>
    )}
    {complex && complex.exercises.length > 0 && <ComplexPlanList complex={complex} />}
  </Sheet>
);

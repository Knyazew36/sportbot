import type { ReactNode } from 'react';

import { useActiveProgram } from '@sportbot/api/entities/program';

import { ComplexPreviewSheet } from '@/widgets/program-preview/ComplexPreviewSheet';

type NextUpWorkoutSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  complexId: number;
};

// Деталка тренировки из блока «следующая по расписанию»: шторка с составом комплекса
export const NextUpWorkoutSheet = ({
  open,
  onOpenChange,
  title,
  description,
  complexId,
}: NextUpWorkoutSheetProps) => {
  const program = useActiveProgram();

  return (
    <ComplexPreviewSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      complex={program.data?.complexes.find((c) => c.id === complexId)}
      loading={program.isPending}
    />
  );
};

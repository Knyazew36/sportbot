import { ArrowRight } from 'lucide-react-native';

import { useCreateBlankProgram } from '@/features/create-program/useCreateBlankProgram';
import { Button } from '@/shared/ui/kit/Button';

// Ничего не подошло — собрать программу с нуля
export const BlankProgramButton = () => {
  const blank = useCreateBlankProgram();
  return (
    <Button
      size="sm"
      iconRight={ArrowRight}
      loading={blank.isPending}
      onPress={() => void blank.create().catch(() => undefined)}
    >
      Собрать свою
    </Button>
  );
};

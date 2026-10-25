import { View } from 'react-native';
import { ArrowRight, LayoutTemplate } from 'lucide-react-native';

import { useCreateBlankProgram } from '@/features/create-program/useCreateBlankProgram';
import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Sheet } from '@/shared/ui/kit/Sheet';

export const NewProgramSheet = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const blank = useCreateBlankProgram();

  const create = () => {
    void blank
      .create()
      .then(() => onOpenChange(false))
      .catch(() => undefined);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Новая программа"
      description="Подбери готовую в каталоге и поправь под себя или собери с чистого листа."
    >
      <View className="gap-3 pt-2 pb-6">
        <ButtonLink
          href={ROUTES.PROGRAM_TEMPLATES}
          size="lg"
          block
          spread
          iconRight={LayoutTemplate}
          onNavigate={() => onOpenChange(false)}
        >
          Из каталога
        </ButtonLink>
        <Button variant="outline" size="lg" block spread iconRight={ArrowRight} loading={blank.isPending} onPress={create}>
          Собрать с нуля
        </Button>
      </View>
    </Sheet>
  );
};

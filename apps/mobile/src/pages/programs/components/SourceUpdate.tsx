import { View } from 'react-native';
import { RefreshCw, Sparkles } from 'lucide-react-native';

import { type ProgramListItem } from '@sportbot/api/entities/program';
import { useDismissProgramUpdate, useResyncProgram } from '@/shared/local/entities/program';

import { useOnlineAction } from '@/shared/lib/hooks/use-online-action';
import { Button } from '@/shared/ui/kit/Button';
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { Icon } from '@/shared/ui/kit/Icon';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';

export const SourceUpdate = ({ program }: { program: ProgramListItem }) => {
  const resync = useResyncProgram();
  const dismiss = useDismissProgramUpdate();
  const net = useOnlineAction();

  return (
    <Rise className="px-gutter">
      <View className="border-primary bg-accent gap-3 border-[1.5px] p-4">
        <View className="flex-row items-center gap-2">
          <Icon as={Sparkles} className="text-primary size-3.5" />
          <Eyebrow tone="primary" className="shrink">
            {program.fromTemplate ? 'Шаблон обновился' : `${program.fromFriend} обновил программу`}
          </Eyebrow>
        </View>
        <Text>
          {program.fromTemplate
            ? `«${program.name}» в каталоге изменилась. Можно забрать новую версию себе.`
            : `«${program.name}» у друга изменилась. Можно забрать новую версию себе.`}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <ConfirmAction
            trigger={<Button variant="alert" size="sm" disabled={net.disabled} />}
            title="Обновить у себя?"
            description="Твои правки в этой программе заменятся новой версией. История тренировок и весов сохранится."
            confirmLabel="Обновить"
            confirmVariant="default"
            onConfirm={() => resync.mutateAsync(program.id)}
          >
            <Icon as={RefreshCw} />
            {net.label('Обновить у себя')}
          </ConfirmAction>
          <Button variant="outline" size="sm" disabled={dismiss.isPending || net.disabled} onPress={() => dismiss.mutate(program.id)}>
            Не сейчас
          </Button>
        </View>
      </View>
    </Rise>
  );
};

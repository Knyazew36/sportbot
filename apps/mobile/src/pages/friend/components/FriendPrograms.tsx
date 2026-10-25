import { useState } from 'react';
import { pluralize } from '@front-cmdt/utils/pluralize';
import { Check, Copy } from 'lucide-react-native';

import { type FriendProfile, useCopyFriendProgram } from '@sportbot/api/entities/social';

import { Button, type ButtonSize } from '@/shared/ui/kit/Button';
import { List, ListRow } from '@/shared/ui/kit/ListRow';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';
import { ProgramPreviewSheet } from '@/widgets/program-preview/ProgramPreviewSheet';

// Программы друга с «Себе»: копия ложится в мои программы, состав можно посмотреть в шторке
export const FriendPrograms = ({ friend }: { friend: FriendProfile }) => {
  const copy = useCopyFriendProgram();
  const [copied, setCopied] = useState<number[]>([]);
  // Программа, чей состав открыт в шторке
  const [preview, setPreview] = useState<number | null>(null);

  // Одна кнопка и в строке, и в шторке: «У тебя» после копирования видно в обоих местах
  const copyButton = (programId: number, size: ButtonSize, block?: boolean) => {
    const isCopied = copied.includes(programId);
    return (
      <Button
        variant={isCopied ? 'outline' : 'default'}
        size={size}
        block={block}
        icon={isCopied ? Check : Copy}
        disabled={isCopied || copy.isPending}
        onPress={() => copy.mutate(programId, { onSuccess: () => setCopied((ids) => [...ids, programId]) })}
      >
        {isCopied ? 'У тебя' : 'Себе'}
      </Button>
    );
  };

  return (
    <>
      {friend.programs.length > 0 && (
        <ScreenSection>
          {/* Заголовок label-секции в kit скрыт — здесь он нужен, поэтому меткой */}
          <Eyebrow>Программы · можно забрать себе</Eyebrow>
          <List>
            {friend.programs.map((p) => (
              // Вся строка открывает состав, «Себе» нажимается отдельно
              <ListRow
                key={p.id}
                className="-mx-gutter px-gutter"
                lead={String(p.complexCount).padStart(2, '0')}
                title={p.name}
                meta={[pluralize(p.complexCount, ['тренировка', 'тренировки', 'тренировок']), p.active && 'активная']
                  .filter(Boolean)
                  .join(' · ')}
                onPress={() => setPreview(p.id)}
                trail={copyButton(p.id, 'xs')}
              />
            ))}
          </List>
          <Text size="xs" tone="muted">
            Копия живёт у тебя в программах с пометкой «от {friend.displayName}». Если друг её обновит — предложим
            обновить и у тебя.
          </Text>
        </ScreenSection>
      )}

      <ProgramPreviewSheet
        program={friend.programs.find((p) => p.id === preview) ?? null}
        onOpenChange={(open) => !open && setPreview(null)}
        note={`Копия появится у тебя в программах с пометкой «от ${friend.displayName}».`}
        action={preview != null && copyButton(preview, 'lg', true)}
      />
    </>
  );
};

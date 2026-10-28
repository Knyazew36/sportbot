import { useState } from 'react';
import { View } from 'react-native';
import { ArrowRight, Pencil, Trash2 } from 'lucide-react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { isPublishable, type Program, type ProgramListItem } from '@sportbot/api/entities/program';
import { useActivateProgram, useDeleteProgram, useProgram } from '@/shared/local/entities/program';

import { PUBLICATION_STATUS } from '@/features/publish-program/publication-status';
import { PublishSheet } from '@/features/publish-program/PublishSheet';
import { ShowOthers } from '@/features/publish-program/ShowOthers';
import { routeHref, ROUTES } from '@/shared/config/routes';
import { WORKOUT_FORMS } from '@/shared/lib/plural-forms';
import { Badge } from '@/shared/ui/kit/Badge';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { Icon } from '@/shared/ui/kit/Icon';
import { List, ListRow } from '@/shared/ui/kit/ListRow';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { StatusFromMeta } from '@/shared/ui/kit/StatusBadge';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';
import { ProgramPreviewSheet } from '@/widgets/program-preview/ProgramPreviewSheet';

type MyProgramsProps = {
  programs: ProgramListItem[];
  title?: string;
  aside?: string;
  /** Сколько строк показать; остальные — на экране «Все мои программы» */
  limit?: number;
  /** Кнопка удаления у каждой строки — на экране «Все мои программы» */
  deletable?: boolean;
};

// Свои программы списком — порт widgets/my-programs/MyPrograms.tsx: строка открывает состав в шторке, оттуда — в редактор;
// неактивную включают одним нажатием, активная отмечена зелёным. С limit — короткий список и ссылка на все
export const MyPrograms = ({ programs, title, aside, limit, deletable }: MyProgramsProps) => {
  const activate = useActivateProgram();
  // Строка пропадает из списка на глазах — тост лишний
  const remove = useDeleteProgram({ silent: true });
  const [openedId, setOpenedId] = useState<number | null>(null);
  const opened = useProgram(openedId ?? undefined);
  // Форма публикации открывается вместо шторки состава, а не поверх неё
  const [publishing, setPublishing] = useState<Program | null>(null);
  // Копии шаблона или чужой программы публиковать нельзя — у них в шторке только «Редактировать»
  const publishable = opened.data && isPublishable(opened.data) ? opened.data : null;
  const openedItem = programs.find((p) => p.id === openedId);
  const shown = limit ? programs.slice(0, limit) : programs;
  if (!shown.length) return null;

  return (
    <ScreenSection title={title} aside={aside}>
      <List>
        {shown.map((p) => (
          // Вся строка открывает шторку; «Сделать активной» и удаление нажимаются отдельно от строки
          <ListRow
            key={p.id}
            className="-mx-gutter px-gutter"
            lead={String(p.complexCount).padStart(2, '0')}
            title={p.name}
            meta={pluralize(p.complexCount, WORKOUT_FORMS)}
            onPress={() => setOpenedId(p.id)}
            trail={
              <View className="flex-row items-center gap-2">
                {p.active ? (
                  <Eyebrow tone="positive">активная</Eyebrow>
                ) : (
                  <Button variant="outline" size="xs" disabled={activate.isPending} onPress={() => activate.mutate(p.id)}>
                    Сделать активной
                  </Button>
                )}
                {deletable && (
                  <ConfirmAction
                    trigger={<Button variant="outline" size="icon-xs" accessibilityLabel={`Удалить «${p.name}»`} />}
                    title="Удалить программу?"
                    description={`«${p.name}» и её тренировки пропадут. История тренировок сохранится.`}
                    confirmLabel="Удалить"
                    onConfirm={() => remove.mutateAsync(p.id)}
                  >
                    <Icon as={Trash2} className="text-destructive size-3.5" />
                  </ConfirmAction>
                )}
              </View>
            }
          >
            {p.fromFriend || p.fromTemplate ? (
              <Badge variant="secondary" className="mt-2">
                {p.fromFriend ? `от ${p.fromFriend}` : 'из каталога'}
              </Badge>
            ) : null}
          </ListRow>
        ))}
      </List>
      {limit != null && programs.length > limit && (
        <ButtonLink href={ROUTES.PROGRAMS_MINE} variant="outline" block iconRight={ArrowRight}>
          Все мои программы
        </ButtonLink>
      )}

      <ProgramPreviewSheet
        // Пока состав грузится, шапку берём из строки списка — шторка открывается сразу
        program={openedItem ? (opened.data ?? { name: openedItem.name, complexes: [] }) : null}
        loading={opened.isPending}
        onOpenChange={(open) => !open && setOpenedId(null)}
        note={
          publishable ? (
            <View className="gap-2">
              <StatusFromMeta meta={PUBLICATION_STATUS[publishable.publication]} />
              {publishable.rejectReason ? <Text tone="danger">Причина: {publishable.rejectReason}</Text> : null}
            </View>
          ) : undefined
        }
        action={
          openedId != null ? (
            <View className="gap-2">
              <ButtonLink
                href={routeHref(ROUTES.PROGRAM, { programId: openedId })}
                size="lg"
                block
                iconRight={Pencil}
                // Шторка рисуется поверх стека — закрываем её до перехода
                onNavigate={() => setOpenedId(null)}
              >
                Редактировать
              </ButtonLink>
              {opened.data && (
                <ShowOthers
                  program={opened.data}
                  size="lg"
                  onPublish={() => {
                    setPublishing(opened.data);
                    setOpenedId(null);
                  }}
                />
              )}
            </View>
          ) : undefined
        }
      />
      {publishing && <PublishSheet program={publishing} open onOpenChange={(open) => !open && setPublishing(null)} />}
    </ScreenSection>
  );
};

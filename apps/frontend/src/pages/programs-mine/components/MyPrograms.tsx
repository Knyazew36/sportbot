import { PencilIcon, Trash2Icon } from 'lucide-react'

import { useState } from 'react'

import {
  isPublishable,
  type Program,
  type ProgramListItem,
  useActivateProgram,
  useDeleteProgram,
  useProgram,
} from '@sportbot/api/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StatusFromMeta } from '@/shared/ui/kit/StatusBadge'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { ProgramPreviewSheet } from '@/widgets/program-preview/ProgramPreviewSheet'

import { PUBLICATION_STATUS } from '@/features/publish-program/publication-status'
import { PublishSheet } from '@/features/publish-program/PublishSheet'
import { ShowOthers } from '@/features/publish-program/ShowOthers'

const COMPLEX_FORMS: [string, string, string] = ['тренировка', 'тренировки', 'тренировок']

type MyProgramsProps = {
  programs: ProgramListItem[]
  /** Кнопка удаления у каждой строки */
  deletable?: boolean
}

// Свои программы списком: строка открывает состав в шторке, оттуда — в редактор; неактивную включают одним нажатием, активная
// отмечена зелёным
export const MyPrograms = ({ programs, deletable }: MyProgramsProps) => {
  const activate = useActivateProgram()
  // Строка пропадает из списка на глазах — тост лишний
  const remove = useDeleteProgram({ silent: true })
  const [openedId, setOpenedId] = useState<number | null>(null)
  const opened = useProgram(openedId ?? undefined)
  // Форма публикации открывается вместо шторки состава, а не поверх неё
  const [publishing, setPublishing] = useState<Program | null>(null)
  // Копии шаблона или чужой программы публиковать нельзя — у них в шторке только «Редактировать»
  const publishable = opened.data && isPublishable(opened.data) ? opened.data : null
  const openedItem = programs.find(p => p.id === openedId)
  if (!programs.length) return null

  return (
    <ScreenSection>
      <List>
        {programs.map(p => (
          // Вся строка открывает шторку: кнопка растянута на строку, «Сделать активной» лежит поверх неё
          <ListRow
            key={p.id}
            className='hover:bg-accent/60 -mx-gutter px-gutter relative transition-colors'
            title={
              <button
                type='button'
                className='text-left after:absolute after:inset-0'
                onClick={() => setOpenedId(p.id)}
              >
                {p.name}
              </button>
            }
            meta={pluralize(p.complexCount, COMPLEX_FORMS)}
            trail={
              <span className='flex items-center gap-2'>
                {p.active ? (
                  <Eyebrow tone='positive'>активная</Eyebrow>
                ) : (
                  <Button
                    variant='outline'
                    size='xs'
                    className='relative z-10'
                    disabled={activate.isPending}
                    onClick={() => activate.mutate(p.id)}
                  >
                    Сделать активной
                  </Button>
                )}
                {deletable && (
                  <ConfirmAction
                    trigger={
                      <Button
                        variant='outline'
                        size='icon-xs'
                        className='text-destructive relative z-10'
                        aria-label={`Удалить «${p.name}»`}
                      />
                    }
                    title='Удалить программу?'
                    description={`«${p.name}» и её тренировки пропадут. История тренировок сохранится.`}
                    confirmLabel='Удалить'
                    onConfirm={() => remove.mutateAsync(p.id)}
                  >
                    <Trash2Icon />
                  </ConfirmAction>
                )}
              </span>
            }
          >
            {(p.fromFriend || p.fromTemplate) && (
              <Badge
                variant='secondary'
                className='mt-2'
              >
                {p.fromFriend ? `от ${p.fromFriend}` : 'из каталога'}
              </Badge>
            )}
          </ListRow>
        ))}
      </List>
      <ProgramPreviewSheet
        // Пока состав грузится, шапку берём из строки списка — шторка открывается сразу
        program={openedItem ? (opened.data ?? { name: openedItem.name, complexes: [] }) : null}
        loading={opened.isPending}
        onOpenChange={open => !open && setOpenedId(null)}
        note={
          publishable && (
            <span className='flex flex-col gap-2'>
              <StatusFromMeta meta={PUBLICATION_STATUS[publishable.publication]} />
              {publishable.rejectReason && (
                <Text
                  as='span'
                  tone='danger'
                >
                  Причина: {publishable.rejectReason}
                </Text>
              )}
            </span>
          )
        }
        action={
          openedId != null && (
            <div className='flex flex-col gap-2'>
              <ButtonLink
                to={buildPath(ROUTES.PROGRAM, { programId: openedId })}
                size='lg'
                className='w-full'
              >
                Редактировать
                <PencilIcon />
              </ButtonLink>
              {opened.data && (
                <ShowOthers
                  program={opened.data}
                  size='lg'
                  onPublish={() => {
                    setPublishing(opened.data)
                    setOpenedId(null)
                  }}
                />
              )}
            </div>
          )
        }
      />
      {publishing && (
        <PublishSheet
          program={publishing}
          open
          onOpenChange={open => !open && setPublishing(null)}
        />
      )}
    </ScreenSection>
  )
}

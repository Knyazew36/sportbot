import { ArrowRightIcon, PencilIcon } from 'lucide-react'

import { useState } from 'react'

import { type ProgramListItem, useActivateProgram, useProgram } from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { pluralize } from '@/shared/lib/format'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { ProgramPreviewSheet } from '@/widgets/program-preview/ProgramPreviewSheet'

const COMPLEX_FORMS: [string, string, string] = ['комплекс', 'комплекса', 'комплексов']

type MyProgramsProps = {
  programs: ProgramListItem[]
  title?: string
  aside?: string
  /** Сколько строк показать; остальные — на странице «Все мои программы» */
  limit?: number
}

// Свои программы списком: строка открывает состав в шторке, оттуда — в редактор; неактивную включают одним нажатием, активная
// отмечена зелёным. С limit — короткий список под плакатом и ссылка на все
export const MyPrograms = ({ programs, title, aside, limit }: MyProgramsProps) => {
  const activate = useActivateProgram()
  const [openedId, setOpenedId] = useState<number | null>(null)
  const opened = useProgram(openedId ?? undefined)
  const openedItem = programs.find(p => p.id === openedId)
  const shown = limit ? programs.slice(0, limit) : programs
  if (!shown.length) return null

  return (
    <ScreenSection
      title={title}
      aside={aside}
    >
      <List>
        {shown.map(p => (
          // Вся строка открывает шторку: кнопка растянута на строку, «Сделать активной» лежит поверх неё
          <ListRow
            key={p.id}
            className='hover:bg-accent/60 -mx-gutter px-gutter relative transition-colors'
            lead={String(p.complexCount).padStart(2, '0')}
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
              p.active ? (
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
              )
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
      {limit != null && programs.length > limit && (
        <ButtonLink
          to={ROUTES.PROGRAMS_MINE}
          variant='outline'
          className='w-full'
        >
          Все мои программы
          <ArrowRightIcon />
        </ButtonLink>
      )}

      <ProgramPreviewSheet
        // Пока состав грузится, шапку берём из строки списка — шторка открывается сразу
        program={openedItem ? (opened.data ?? { name: openedItem.name, complexes: [] }) : null}
        loading={opened.isPending}
        onOpenChange={open => !open && setOpenedId(null)}
        action={
          openedId != null && (
            <ButtonLink
              to={buildPath(ROUTES.PROGRAM, { programId: openedId })}
              size='lg'
              className='w-full'
            >
              Редактировать
              <PencilIcon />
            </ButtonLink>
          )
        }
      />
    </ScreenSection>
  )
}

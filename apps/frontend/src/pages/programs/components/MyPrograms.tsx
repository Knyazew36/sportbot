import { ArrowRightIcon } from 'lucide-react'
import { Link } from 'react-router'

import { type ProgramListItem, useActivateProgram } from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { pluralize } from '@/shared/lib/format'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'

const COMPLEX_FORMS: [string, string, string] = ['комплекс', 'комплекса', 'комплексов']

type MyProgramsProps = {
  programs: ProgramListItem[]
  title?: string
  aside?: string
  /** Сколько строк показать; остальные — на странице «Все мои программы» */
  limit?: number
}

// Свои программы списком: строка ведёт в программу, неактивную включают одним нажатием, активная
// отмечена зелёным. С limit — короткий список под плакатом и ссылка на все
export const MyPrograms = ({ programs, title, aside, limit }: MyProgramsProps) => {
  const activate = useActivateProgram()
  const shown = limit ? programs.slice(0, limit) : programs
  if (!shown.length) return null

  return (
    <ScreenSection
      title={title}
      aside={aside}
    >
      <List>
        {shown.map(p => (
          // Вся строка ведёт в программу: ссылка растянута на строку, кнопка лежит поверх неё
          <ListRow
            key={p.id}
            className='hover:bg-accent/60 -mx-gutter px-gutter relative transition-colors'
            lead={String(p.complexCount).padStart(2, '0')}
            title={
              <Link
                to={buildPath(ROUTES.PROGRAM, { programId: p.id })}
                className='after:absolute after:inset-0'
              >
                {p.name}
              </Link>
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
    </ScreenSection>
  )
}

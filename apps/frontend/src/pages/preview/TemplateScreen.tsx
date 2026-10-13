import { ArrowRightIcon, CheckIcon, PlusIcon } from 'lucide-react'
import { useParams } from 'react-router'

import { ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StateView } from '@/shared/ui/kit/StateView'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Ticket } from '@/shared/ui/kit/Ticket'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { templates } from './model/mock'
import { takeTemplate, useTakenTemplates } from './model/preview-settings'

const LETTERS = 'ABCDEFGHIJ'

// Шаблон целиком: что за тренировки внутри, прежде чем брать себе (frontend-tz, 10.2)
const TemplateScreen = () => {
  const { templateId } = useParams()
  const template = templates.find(t => String(t.id) === templateId)
  const taken = useTakenTemplates()

  if (!template) {
    return (
      <Screen
        header={
          <TopBar
            back={ROUTES.PREVIEW_PROGRAM_TEMPLATES}
            title='Шаблон'
          />
        }
        className='px-5'
      >
        <StateView
          state='empty'
          empty={{
            title: 'Шаблон не найден',
            description: 'Возможно, его убрали из каталога.',
            action: (
              <ButtonLink
                to={ROUTES.PREVIEW_PROGRAM_TEMPLATES}
                variant='outline'
                size='sm'
              >
                К шаблонам
              </ButtonLink>
            ),
          }}
        />
      </Screen>
    )
  }

  const isTaken = taken.includes(template.id)
  const exercises = template.complexes.reduce((sum, c) => sum + c.exercises.length, 0)

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.PREVIEW_PROGRAM_TEMPLATES}
          title={template.title}
          subtitle={`шаблон · ${template.level}`}
        />
      }
      footer={
        <StickyFooter>
          {isTaken ? (
            <ButtonLink
              to={ROUTES.PREVIEW_PROGRAMS}
              variant='outline'
              size='lg'
              className='w-full justify-between'
            >
              <span className='flex items-center gap-2'>
                <CheckIcon
                  className='size-5'
                  strokeWidth={3}
                />
                В твоих программах
              </span>
              <ArrowRightIcon className='size-6' />
            </ButtonLink>
          ) : (
            <Button
              size='lg'
              className='w-full justify-between'
              onClick={() => takeTemplate(template.id)}
            >
              Взять себе
              <PlusIcon
                className='size-6'
                strokeWidth={2.5}
              />
            </Button>
          )}
        </StickyFooter>
      }
    >
      <Rise className='px-5'>
        <Poster
          as='h1'
          size='3xl'
          tone='primary'
          className='hyphens-auto'
        >
          {template.title}
        </Poster>
        <Text
          tone='soft'
          className='mt-3'
        >
          {template.description}
        </Text>
      </Rise>

      <Rise className='px-5'>
        <StatGrid
          items={[
            { label: 'в неделю', value: template.days },
            { label: 'комплекса', value: template.complexes.length },
            { label: 'упражнений', value: exercises },
          ]}
        />
      </Rise>

      <ScreenSection
        title='Очередь комплексов'
        aside='по кругу, с первого'
        bleed
      >
        <ol className='no-scrollbar flex gap-2 overflow-x-auto px-5'>
          {template.complexes.map((c, i) => (
            <li key={c.title}>
              <Ticket
                mark={LETTERS[i]}
                title={c.title}
                active={i === 0}
              >
                <Eyebrow>{c.exercises.length} упр.</Eyebrow>
              </Ticket>
            </li>
          ))}
        </ol>
      </ScreenSection>

      {template.complexes.map((c, i) => (
        <ScreenSection
          key={c.title}
          title={`${LETTERS[i]} · ${c.title}`}
          aside={`${c.exercises.reduce((sum, e) => sum + e.sets, 0)} подходов`}
        >
          <List>
            {c.exercises.map((e, j) => (
              <ListRow
                key={e.name}
                lead={String(j + 1).padStart(2, '0')}
                title={e.name}
                meta={e.muscles}
                trail={
                  <Poster
                    as='span'
                    size='sm'
                    className='whitespace-nowrap'
                  >
                    {e.sets} × {e.reps}
                  </Poster>
                }
              />
            ))}
          </List>
        </ScreenSection>
      ))}

      <Rise className='px-5'>
        <Text
          size='xs'
          tone='muted'
        >
          После «Взять» шаблон становится твоей программой — его можно править.
        </Text>
      </Rise>
    </Screen>
  )
}

export default TemplateScreen

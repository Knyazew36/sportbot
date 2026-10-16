import { CheckIcon, EyeIcon, PlusIcon } from 'lucide-react'

import { buildPath, ROUTES } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Lead, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'

import { templates } from './model/mock'
import { takeTemplate, useTakenTemplates } from './model/preview-settings'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { EXERCISE_FORMS } from '@/shared/lib/plural-forms'

// Шаблоны программ: посмотреть состав или сразу «Взять» — копия в программах пользователя (frontend-tz, 10.2)
const TemplatesScreen = () => {
  const taken = useTakenTemplates()

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.PREVIEW_PROGRAMS}
          title='Шаблоны'
          subtitle={`${templates.length} готовые программы`}
        />
      }
      className='gap-4 px-gutter'
    >
      <Rise>
        <Lead>возьми и поправь под себя</Lead>
      </Rise>
      {templates.map((t, i) => {
        const isTaken = taken.includes(t.id)
        const exercises = t.complexes.reduce((sum, c) => sum + c.exercises.length, 0)
        return (
          <Rise
            key={t.id}
            className={cn('border-foreground/80 flex flex-col gap-3 border-[1.5px] p-4', isTaken && 'border-primary')}
          >
            <div className='flex items-start justify-between gap-3'>
              <Poster
                as='h2'
                size='lg'
              >
                {t.title}
              </Poster>
              <Poster
                as='span'
                size='lg'
                tone='faint'
              >
                {String(i + 1).padStart(2, '0')}
              </Poster>
            </div>
            <Text tone='soft'>{t.description}</Text>
            <div className='flex flex-wrap gap-1.5'>
              <Badge>{t.days} дня в неделю</Badge>
              <Badge variant='secondary'>{pluralize(exercises, EXERCISE_FORMS)}</Badge>
              {t.complexes.map(c => (
                <Badge
                  key={c.title}
                  variant='outline'
                >
                  {c.title}
                </Badge>
              ))}
            </div>
            <div className='mt-1 grid grid-cols-2 gap-2'>
              <ButtonLink
                to={buildPath(ROUTES.PREVIEW_PROGRAM_TEMPLATE, { templateId: t.id })}
                variant='outline'
                size='sm'
                className='h-11'
              >
                <EyeIcon />
                Посмотреть
              </ButtonLink>
              <Button
                variant={isTaken ? 'outline' : 'default'}
                size='sm'
                className='h-11'
                disabled={isTaken}
                onClick={() => takeTemplate(t.id)}
              >
                {isTaken ? <CheckIcon strokeWidth={3} /> : <PlusIcon strokeWidth={3} />}
                {isTaken ? 'Взят' : 'Взять'}
              </Button>
            </div>
          </Rise>
        )
      })}
    </Screen>
  )
}

export default TemplatesScreen

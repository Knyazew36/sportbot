import { ArrowRightIcon, EyeIcon, PlusIcon } from 'lucide-react'
import { useNavigate } from 'react-router'

import { type Program, useTakeTemplate } from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { pluralize } from '@/shared/lib/format'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'

// Карточка каталога: состав одним взглядом и «Взять». Уже взятый шаблон открывает свою копию —
// взять второй раз можно со страницы шаблона, а не случайным нажатием здесь
export const TemplateCard = ({ template: t, index }: { template: Program; index: number }) => {
  const take = useTakeTemplate()
  const navigate = useNavigate()
  const exercises = t.complexes.reduce((sum, c) => sum + c.exercises.length, 0)

  return (
    <Rise className='border-foreground/80 flex flex-col gap-3 border-[1.5px] p-4'>
      <div className='flex items-start justify-between gap-3'>
        <Poster
          as='h2'
          size='lg'
        >
          {t.name}
        </Poster>
        <Poster
          as='span'
          size='lg'
          tone='faint'
        >
          {String(index + 1).padStart(2, '0')}
        </Poster>
      </div>
      {t.description && <Text tone='soft'>{t.description}</Text>}
      {/* Бейджи — только теги подбора; состав — обычной подписью, чтобы «День А» не путали с тегами */}
      {(t.takenProgramId != null || t.tags.length > 0) && (
        <div className='flex flex-wrap gap-1.5'>
          {t.takenProgramId != null && <Badge variant='secondary'>уже у тебя</Badge>}
          {t.tags.map(tg => (
            <Badge key={tg.id}>{tg.name}</Badge>
          ))}
        </div>
      )}
      <Eyebrow as='p'>
        {pluralize(t.complexes.length, ['комплекс', 'комплекса', 'комплексов'])} ·{' '}
        {pluralize(exercises, ['упражнение', 'упражнения', 'упражнений'])}
      </Eyebrow>
      <div className='mt-1 grid grid-cols-2 gap-2'>
        <ButtonLink
          to={buildPath(ROUTES.PROGRAM_TEMPLATE, { templateId: t.id })}
          variant='outline'
          size='sm'
          className='h-11'
        >
          <EyeIcon />
          Посмотреть
        </ButtonLink>
        {t.takenProgramId != null ? (
          <ButtonLink
            to={buildPath(ROUTES.PROGRAM, { programId: t.takenProgramId })}
            size='sm'
            className='h-11'
          >
            Открыть
            <ArrowRightIcon strokeWidth={3} />
          </ButtonLink>
        ) : (
          <Button
            size='sm'
            className='h-11'
            disabled={take.isPending}
            onClick={() =>
              take.mutate(t.id, {
                onSuccess: copy => navigate(buildPath(ROUTES.PROGRAM, { programId: copy.id })),
              })
            }
          >
            <PlusIcon strokeWidth={3} />
            Взять
          </Button>
        )}
      </div>
    </Rise>
  )
}

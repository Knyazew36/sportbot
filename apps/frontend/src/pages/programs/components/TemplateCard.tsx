import { ArrowRightIcon, PlusIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { addedText, catalogItemPath, catalogSourceOf, type Program, useTakeTemplate } from '@/entities/program'
import { toAssetUrl } from '@/shared/api'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { EXERCISE_FORMS } from '@/shared/lib/plural-forms'

/** Тегов на карточке: остальные видно на странице программы */
const CARD_TAGS = 3

const COMPLEX_FORMS: [string, string, string] = ['тренировка', 'тренировки', 'тренировок']

/** Вырез корешка — полукруг цвета фона на линии отрыва */
const Notch = ({ className }: { className: string }) => (
  <span
    className={cn(
      'bg-background border-foreground/80 absolute left-[73px] size-3 rounded-full border-[1.5px]',
      className,
    )}
  />
)

// Программа каталога — билет: на корешке крупно, сколько комплексов в очереди (главное «сколько дней в цикле»),
// справа название, автор, теги и «Взять». Тап по билету открывает программу. Уже взятую — открывает свою копию:
// второй раз берут со страницы программы, а не случайным нажатием здесь. Свою программу не берут — её открывают
export const TemplateCard = ({ template: t }: { template: Program }) => {
  const take = useTakeTemplate()
  const navigate = useNavigate()
  const exercises = t.complexes.reduce((sum, c) => sum + c.exercises.length, 0)
  const openId = t.mine ? t.id : t.takenProgramId
  // Взятую не подписываем: и так видно по кнопке «Открыть» и бледной цифре на корешке
  const status = t.mine ? 'твоя' : null
  // Слово без числа: число стоит на корешке плакатом
  const complexWord = pluralize(t.complexes.length, COMPLEX_FORMS).replace(/^\S+\s/, '')

  return (
    <Rise className='border-foreground/80 bg-card hover:bg-accent/60 relative flex border-[1.5px] transition-colors'>
      <div className='border-foreground/40 flex w-20 shrink-0 flex-col items-center justify-center gap-1 border-r-[1.5px] border-dashed py-3'>
        <Poster
          as='span'
          size='2xl'
          numeric
          tone={openId != null ? 'faint' : 'primary'}
        >
          {t.complexes.length}
        </Poster>
        <Eyebrow
          size='sm'
          className='text-center tracking-normal'
        >
          {complexWord}
        </Eyebrow>
      </div>
      <Notch className='-top-[7px]' />
      <Notch className='-bottom-[7px]' />

      <div className='flex min-w-0 flex-1 flex-col gap-2 p-3'>
        <Poster
          as='h3'
          size='md'
          className='line-clamp-2'
        >
          {/* Ссылка растянута на весь билет, кнопка действия лежит поверх */}
          <Link
            to={catalogItemPath(t.id, catalogSourceOf(t))}
            className='after:absolute after:inset-0'
          >
            {t.name}
          </Link>
        </Poster>
        {t.author && (
          <div className='flex items-center gap-2'>
            <PersonAvatar
              name={t.author.name}
              src={toAssetUrl(t.author.avatarUrl)}
              size='xs'
            />
            <Text
              size='sm'
              tone='muted'
              className='truncate'
            >
              {t.author.name}
            </Text>
          </div>
        )}
        {t.description && (
          <Text
            size='sm'
            tone='soft'
            className='line-clamp-5'
          >
            {t.description}
          </Text>
        )}
        {/* Бейджи — только теги подбора; состав и «твоя» — подписью */}
        {t.tags.length > 0 && (
          <div className='flex flex-wrap gap-1.5'>
            {t.tags.slice(0, CARD_TAGS).map(tg => (
              <Badge key={tg.id}>{tg.name}</Badge>
            ))}
          </div>
        )}
        <div className='mt-1 flex items-end justify-between gap-3'>
          <Eyebrow
            as='p'
            className='min-w-0'
          >
            {pluralize(exercises, EXERCISE_FORMS)}
            {t.addedCount > 0 && ` · ${addedText(t.addedCount)}`}
            {status && (
              <>
                {' · '}
                <span className='text-primary'>{status}</span>
              </>
            )}
          </Eyebrow>
          {openId != null ? (
            <ButtonLink
              to={buildPath(ROUTES.PROGRAM, { programId: openId })}
              variant='outline'
              size='sm'
              className='relative z-10 shrink-0'
            >
              Открыть
              <ArrowRightIcon strokeWidth={3} />
            </ButtonLink>
          ) : (
            <Button
              size='sm'
              className='relative z-10 shrink-0'
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
      </div>
    </Rise>
  )
}

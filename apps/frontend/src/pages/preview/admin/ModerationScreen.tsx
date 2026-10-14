import { ArrowRightIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import { useState } from 'react'

import { muscleNames } from '@/entities/catalog/lib'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { List } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { ScreenState } from '@/shared/ui/kit/ScreenState'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'

import { moderationQueue } from '../model/admin'
import { exercises, muscles, stretches } from '../model/catalog'

type Outcome = 'approve' | 'edit' | 'duplicate' | 'reject'

const OUTCOMES: { value: Outcome; label: string }[] = [
  { value: 'approve', label: 'Одобрить' },
  { value: 'edit', label: 'С правками' },
  { value: 'duplicate', label: 'Дубль' },
  { value: 'reject', label: 'Отклонить' },
]

// Что получит автор и что станет с черновиком (business-tz, 5.6)
const OUTCOME_HINT: Record<Outcome, string> = {
  approve: 'Запись попадёт в общий справочник, у автора черновик заменится на неё.',
  edit: 'Откроется форма записи: допиши технику, картинку, суставы — и сохрани.',
  duplicate: 'Черновик заменится выбранной записью во всех комплексах, история весов перенесётся.',
  reject: 'Запись останется личным черновиком автора, в справочник не попадёт.',
}

const backToQueue = `${ROUTES.PREVIEW_ADMIN}?tab=moderation`

// Карточка заявки на модерацию и четыре исхода (frontend-tz, 14.3)
const ModerationScreen = () => {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const request = moderationQueue.find(r => String(r.id) === requestId)
  const [outcome, setOutcome] = useState<Outcome>('approve')
  const [duplicateOf, setDuplicateOf] = useState<number | null>(null)
  const [reason, setReason] = useState('')

  if (!request) {
    return (
      <Screen
        header={
          <TopBar
            back={backToQueue}
            title='Заявка'
          />
        }
        className='px-gutter'
      >
        <ScreenState
          state='empty'
          title='Заявка не найдена'
          description='Возможно, её уже разобрали.'
        />
      </Screen>
    )
  }

  const similar = (request.kind === 'exercise' ? exercises : stretches)
    .filter(x => request.similarIds.includes(x.id))
    .map(x => ({
      id: x.id,
      name: x.name,
      imageUrl: x.imageUrl,
      muscles: 'primaryMuscles' in x ? x.primaryMuscles : x.muscles,
    }))
  const requestMuscles = muscles.filter(m => request.muscles.includes(m.code))
  // Отказ и дубль без причины автор не поймёт; у дубля ещё нужна сама запись
  const ready =
    outcome === 'approve' ||
    outcome === 'edit' ||
    (reason.trim().length >= 3 && (outcome !== 'duplicate' || duplicateOf != null))

  return (
    <Screen
      header={
        <TopBar
          back={backToQueue}
          title='Заявка'
          subtitle={`от ${request.author} · ${request.createdAt}`}
        />
      }
      footer={
        <StickyFooter>
          {outcome === 'edit' ? (
            <ButtonLink
              to={`${buildPath(ROUTES.PREVIEW_ADMIN_CATALOG_ITEM, { kind: request.kind, itemId: 'new' })}?request=${request.id}`}
              size='lg'
              className='w-full justify-between'
            >
              Открыть форму
              <ArrowRightIcon className='size-6' />
            </ButtonLink>
          ) : (
            <Button
              variant={outcome === 'reject' ? 'destructive' : 'default'}
              size='lg'
              className='w-full'
              disabled={!ready}
              onClick={() => navigate(backToQueue)}
            >
              {OUTCOMES.find(o => o.value === outcome)?.label}
            </Button>
          )}
        </StickyFooter>
      }
      className='gap-8'
    >
      <Rise className='px-gutter'>
        <Badge variant='secondary'>{request.kind === 'exercise' ? 'упражнение' : 'растяжка'}</Badge>
        <Poster
          as='h1'
          size='2xl'
          className='mt-3 hyphens-auto'
        >
          {request.name}
        </Poster>
        <dl className='mt-4 grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-3'>
          <Eyebrow as='dt'>Мышцы</Eyebrow>
          <Text as='dd'>{muscleNames(requestMuscles)}</Text>
          {request.holdSeconds && (
            <>
              <Eyebrow as='dt'>Удержание</Eyebrow>
              <Text as='dd'>
                {request.holdSeconds} с{request.perSide ? ', на каждую сторону' : ''}
              </Text>
            </>
          )}
          <Eyebrow as='dt'>Описание</Eyebrow>
          <Text as='dd'>{request.text ?? <span className='text-muted-foreground'>не заполнено</span>}</Text>
          <Eyebrow as='dt'>Видео</Eyebrow>
          <Text
            as='dd'
            className='truncate'
          >
            {request.videoUrl ?? <span className='text-muted-foreground'>нет</span>}
          </Text>
        </dl>
      </Rise>

      <ScreenSection
        title='Похожие в справочнике'
        aside={similar.length > 0 ? 'возможный дубль' : undefined}
      >
        {similar.length === 0 ? (
          <Text tone='muted'>Похожих записей нет.</Text>
        ) : (
          <List>
            {similar.map(x => (
              <CatalogRow
                key={x.id}
                name={x.name}
                imageUrl={x.imageUrl}
                meta={muscleNames(x.muscles)}
                selected={outcome === 'duplicate' && duplicateOf === x.id}
                trail={
                  outcome === 'duplicate' && (
                    <Button
                      variant={duplicateOf === x.id ? 'default' : 'outline'}
                      size='xs'
                      aria-pressed={duplicateOf === x.id}
                      onClick={() => setDuplicateOf(x.id)}
                    >
                      {duplicateOf === x.id ? 'Выбрана' : 'Это она'}
                    </Button>
                  )
                }
              />
            ))}
          </List>
        )}
      </ScreenSection>

      <ScreenSection title='Исход'>
        <div className='no-scrollbar -mx-gutter overflow-x-auto px-gutter pb-1'>
          <Segmented
            options={OUTCOMES}
            value={outcome}
            onValueChange={setOutcome}
            size='default'
          />
        </div>
        <Text tone='soft'>{OUTCOME_HINT[outcome]}</Text>
        {outcome === 'duplicate' && similar.length > 0 && duplicateOf == null && (
          <Text
            size='sm'
            tone='danger'
          >
            Выбери запись выше, которой заменить черновик.
          </Text>
        )}
        {outcome !== 'edit' && (
          <div className='flex flex-col gap-2'>
            <Label htmlFor='reason'>Причина для автора{outcome === 'approve' ? ' · необязательно' : ''}</Label>
            <Input
              id='reason'
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={
                outcome === 'reject' ? 'Например: это самомассаж, а не растяжка' : 'Коротко, придёт сообщением от бота'
              }
              maxLength={120}
            />
          </div>
        )}
      </ScreenSection>
    </Screen>
  )
}

export default ModerationScreen

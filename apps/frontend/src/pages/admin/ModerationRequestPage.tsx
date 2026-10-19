import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'

import { useState } from 'react'

import {
  type AdminRequest,
  moderationSchema,
  type ModerationValues,
  useApproveRequest,
  useDuplicateRequest,
  useModerationRequest,
  useRejectRequest,
  useUploadCatalogImage,
} from '@/entities/admin'
import { type Equipment, EQUIPMENT_LABEL, useJoints } from '@/entities/catalog'
import { ROUTES } from '@/shared/config/paths'
import { applyFieldErrors } from '@/shared/lib/form'
import { formatDate } from '@/shared/lib/format'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { List } from '@/shared/ui/kit/ListRow'
import { MistakeList } from '@/shared/ui/kit/MistakeList'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { StepList } from '@/shared/ui/kit/StepList'
import { TextField } from '@/shared/ui/kit/TextField'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'
import { ImageField } from '@/widgets/catalog/ImageField'
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet'

type Outcome = ModerationValues['outcome']

const OUTCOMES: { value: Outcome; label: string }[] = [
  { value: 'approve', label: 'Одобрить' },
  { value: 'edit', label: 'С правками' },
  { value: 'duplicate', label: 'Дубль' },
  { value: 'reject', label: 'Отклонить' },
]

// Что получит автор и что станет с черновиком (business-tz, 5.6)
const OUTCOME_HINT: Record<Outcome, string> = {
  approve: 'Запись попадёт в общий справочник, у автора черновик заменится на неё.',
  edit: 'Поправь название, допиши технику, картинку, инвентарь и суставы — запись попадёт в справочник уже с ними.',
  duplicate: 'Черновик заменится выбранной записью во всех программах, история весов перенесётся.',
  reject: 'Запись останется личным черновиком автора, в справочник не попадёт.',
}

const EQUIPMENT = (Object.keys(EQUIPMENT_LABEL) as Equipment[]).map(value => ({ value, label: EQUIPMENT_LABEL[value] }))
const BACK = `${ROUTES.ADMIN}?tab=moderation`
const FORM_ID = 'moderation'

const RequestForm = ({ request }: { request: AdminRequest }) => {
  const navigate = useNavigate()
  const joints = useJoints()
  const approve = useApproveRequest()
  const duplicate = useDuplicateRequest()
  const reject = useRejectRequest()
  const upload = useUploadCatalogImage()
  const entry = request.entry
  // Похожая запись в шторке: сравнить с заявкой, не уходя с экрана
  const [preview, setPreview] = useState<AdminRequest['similar'][number] | null>(null)
  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ModerationValues>({
    resolver: zodResolver(moderationSchema),
    defaultValues: {
      outcome: 'approve',
      reason: '',
      targetId: null,
      name: entry?.name ?? '',
      text: entry?.text ?? '',
      imagePath: null,
      equipment: null,
      jointIds: [],
    },
  })
  const [outcome, targetId] = useWatch({ control, name: ['outcome', 'targetId'] })
  const pending = approve.isPending || duplicate.isPending || reject.isPending

  const submit = handleSubmit(v => {
    const reason = v.reason || undefined
    const done = () => navigate(BACK, { replace: true })
    const request$ =
      v.outcome === 'reject'
        ? reject.mutateAsync({ id: request.id, reason: v.reason })
        : v.outcome === 'duplicate'
          ? duplicate.mutateAsync({ id: request.id, targetId: v.targetId!, reason })
          : approve.mutateAsync({
              id: request.id,
              reason,
              ...(v.outcome === 'edit' && {
                name: v.name !== entry?.name ? v.name : undefined,
                text: v.text || undefined,
                imagePath: v.imagePath ?? undefined,
                equipment: v.equipment ?? undefined,
                jointIds: v.jointIds,
              }),
            })
    return request$.then(done).catch(error => applyFieldErrors(error, setError))
  })

  return (
    <>
      <Rise className='px-gutter'>
        <Badge variant='secondary'>{request.kind === 'exercise' ? 'упражнение' : 'растяжка'}</Badge>
        <Poster
          as='h1'
          size='2xl'
          className='mt-3 hyphens-auto'
        >
          {entry?.name ?? 'Запись удалена'}
        </Poster>
        {entry && (
          <dl className='mt-4 grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-3'>
            <Eyebrow as='dt'>Мышцы</Eyebrow>
            <Text as='dd'>
              {entry.primaryMuscles.join(' · ')}
              {entry.secondaryMuscles.length > 0 && (
                <span className='text-muted-foreground'> · помогают: {entry.secondaryMuscles.join(', ')}</span>
              )}
            </Text>
            {entry.holdSeconds != null && (
              <>
                <Eyebrow as='dt'>Удержание</Eyebrow>
                <Text as='dd'>
                  {entry.holdSeconds} с{entry.perSide ? ', на каждую сторону' : ''}
                </Text>
              </>
            )}
            <Eyebrow as='dt'>Описание</Eyebrow>
            <Text as='dd'>{entry.text ?? <span className='text-muted-foreground'>не заполнено</span>}</Text>
            {entry.steps.length > 0 && (
              <>
                <Eyebrow as='dt'>Шаги</Eyebrow>
                <dd>
                  <StepList items={entry.steps} />
                </dd>
              </>
            )}
            {entry.mistakes.length > 0 && (
              <>
                <Eyebrow as='dt'>Ошибки</Eyebrow>
                <dd>
                  <MistakeList items={entry.mistakes} />
                </dd>
              </>
            )}
            <Eyebrow as='dt'>Видео</Eyebrow>
            <Text
              as='dd'
              className='truncate'
            >
              {entry.videoUrl ?? <span className='text-muted-foreground'>нет</span>}
            </Text>
          </dl>
        )}
      </Rise>

      <ScreenSection
        title='Похожие в справочнике'
        aside={request.similar.length > 0 ? 'возможный дубль' : undefined}
      >
        {request.similar.length === 0 ? (
          <Text tone='muted'>Похожих записей нет.</Text>
        ) : (
          <List>
            {request.similar.map(x => (
              <CatalogRow
                key={x.id}
                name={x.name}
                imageUrl={null}
                meta='запись справочника'
                onClick={() => setPreview(x)}
                selected={outcome === 'duplicate' && targetId === x.id}
                trail={
                  outcome === 'duplicate' && (
                    <Button
                      type='button'
                      variant={targetId === x.id ? 'default' : 'outline'}
                      size='xs'
                      aria-pressed={targetId === x.id}
                      onClick={() => setValue('targetId', x.id, { shouldValidate: true })}
                    >
                      {targetId === x.id ? 'Выбрана' : 'Это она'}
                    </Button>
                  )
                }
              />
            ))}
          </List>
        )}
      </ScreenSection>

      <ExerciseSheet
        exercise={preview}
        kind={request.kind}
        onOpenChange={open => !open && setPreview(null)}
        action={
          preview && (
            <Button
              size='lg'
              className='w-full'
              disabled={request.outcome !== 'PENDING'}
              onClick={() => {
                setValue('outcome', 'duplicate')
                setValue('targetId', preview.id, { shouldValidate: true })
                setPreview(null)
              }}
            >
              {outcome === 'duplicate' && targetId === preview.id ? 'Уже выбрана дублем' : 'Это она — дубль'}
            </Button>
          )
        }
      />

      <form
        id={FORM_ID}
        className='contents'
        onSubmit={submit}
      >
        <ScreenSection title='Исход'>
          <div className='no-scrollbar -mx-gutter px-gutter overflow-x-auto pb-1'>
            <Controller
              control={control}
              name='outcome'
              render={({ field }) => (
                <Segmented
                  options={OUTCOMES}
                  value={field.value}
                  onValueChange={field.onChange}
                  size='default'
                />
              )}
            />
          </div>
          <Text tone='soft'>{OUTCOME_HINT[outcome]}</Text>
          <ErrorText errors={errors.targetId} />
          <TextField
            label={`Причина для автора${outcome === 'reject' ? '' : ' · необязательно'}`}
            placeholder={
              outcome === 'reject' ? 'Например: это самомассаж, а не растяжка' : 'Коротко, придёт сообщением от бота'
            }
            maxLength={200}
            error={errors.reason}
            {...register('reason')}
          />
        </ScreenSection>

        {outcome === 'edit' && (
          <>
            <ScreenSection title='Картинка'>
              <ImageField
                initialUrl={null}
                alt={entry?.name ?? ''}
                upload={upload}
                onUploaded={path => setValue('imagePath', path)}
              />
            </ScreenSection>
            {request.kind === 'exercise' && (
              <>
                <ScreenSection title='Инвентарь'>
                  <div className='no-scrollbar -mx-gutter px-gutter overflow-x-auto pb-1'>
                    <Controller
                      control={control}
                      name='equipment'
                      render={({ field }) => (
                        <Segmented
                          options={EQUIPMENT}
                          value={field.value ?? 'BARBELL'}
                          onValueChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </ScreenSection>
                <ScreenSection
                  title='Суставы под нагрузкой'
                  aside='для ограничений'
                >
                  <Controller
                    control={control}
                    name='jointIds'
                    render={({ field }) => (
                      <ToggleGroup
                        multiple
                        value={field.value.map(String)}
                        onValueChange={v => field.onChange(v.map(Number))}
                        className='grid w-full grid-cols-2 gap-2'
                      >
                        {(joints.data ?? []).map(j => (
                          <ToggleGroupItem
                            key={j.id}
                            value={String(j.id)}
                            className='h-11 justify-start px-3'
                          >
                            {j.name}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    )}
                  />
                </ScreenSection>
              </>
            )}
            <ScreenSection title='Описание'>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='request-text'>{request.kind === 'exercise' ? 'Техника' : 'Как делать'}</Label>
                <Textarea
                  id='request-text'
                  aria-invalid={!!errors.text}
                  {...register('text')}
                />
                <ErrorText errors={errors.text} />
              </div>
            </ScreenSection>
          </>
        )}
      </form>

      <StickyFooter>
        <Button
          type='submit'
          form={FORM_ID}
          variant={outcome === 'reject' ? 'destructive' : 'default'}
          size='lg'
          disabled={pending || request.outcome !== 'PENDING'}
        >
          {request.outcome !== 'PENDING' ? 'Заявка уже разобрана' : OUTCOMES.find(o => o.value === outcome)?.label}
        </Button>
      </StickyFooter>
    </>
  )
}

// Карточка заявки на модерацию и четыре исхода (frontend-tz, 14.3)
const ModerationRequestPage = () => {
  const requestId = Number(useParams().requestId)
  const request = useModerationRequest(requestId)

  return (
    <Screen
      header={
        <TopBar
          back={BACK}
          title='Заявка'
          subtitle={
            request.data &&
            `от ${request.data.author ?? 'удалённого пользователя'} · ${formatDate(request.data.createdAt, 'd MMM')}`
          }
        />
      }
      className='gap-8'
    >
      <QueryScreen query={request}>{r => <RequestForm request={r} />}</QueryScreen>
    </Screen>
  )
}

export default ModerationRequestPage

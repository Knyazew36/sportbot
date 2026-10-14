import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRightIcon, CheckIcon } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useSearchParams } from 'react-router'

import { useState } from 'react'

import {
  type CatalogKind,
  DRAFT_STEP_FIELDS,
  type DraftInput,
  draftSchema,
  type DraftValues,
  useCreateDraft,
  useDraftLimit,
  useMuscles,
  useSimilar,
} from '@/entities/catalog'
import { getFieldErrors } from '@/shared/api'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { applyFieldErrors } from '@/shared/lib/form'
import { useDebouncedValue } from '@/shared/lib/hooks/use-debounced-value'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { List } from '@/shared/ui/kit/ListRow'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { ScreenState } from '@/shared/ui/kit/ScreenState'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { SettingRow } from '@/shared/ui/kit/SettingRow'
import { StepBar } from '@/shared/ui/kit/StepBar'
import { TextField } from '@/shared/ui/kit/TextField'
import { Lead, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'

const HOLDS = ['20', '30', '45', '60'] as const
const STEPS = ['Название', 'Мышцы', 'Подробности']
const BACK = `${ROUTES.LIBRARY}?tab=mine`

// «Возможно, ты искал…»: похожие записи справочника, чтобы не плодить дубли (business-tz, 5.5)
const Similar = ({ kind, name }: { kind: CatalogKind; name: string }) => {
  const similar = useSimilar(kind, useDebouncedValue(name.trim(), 400))
  if (!similar.data?.length) return null
  return (
    <ScreenSection
      title='Возможно, ты искал…'
      aside='уже есть в справочнике'
    >
      <List>
        {similar.data.map(m => (
          <CatalogRow
            key={m.id}
            name={m.name}
            imageUrl={null}
            meta={kind === 'exercise' ? 'упражнение справочника' : 'растяжка справочника'}
            to={
              kind === 'exercise'
                ? buildPath(ROUTES.EXERCISE, { exerciseId: m.id })
                : buildPath(ROUTES.STRETCH, { stretchId: m.id })
            }
          />
        ))}
      </List>
      <Text
        size='xs'
        tone='muted'
      >
        Не то? Жми «Дальше» — создадим своё.
      </Text>
    </ScreenSection>
  )
}

const Wizard = ({ kind, onDone }: { kind: CatalogKind; onDone: (name: string) => void }) => {
  const [step, setStep] = useState(0)
  const muscles = useMuscles()
  const create = useCreateDraft()
  const {
    register,
    control,
    handleSubmit,
    trigger,
    setError,
    formState: { errors },
  } = useForm<DraftInput, unknown, DraftValues>({
    resolver: zodResolver(draftSchema),
    defaultValues: { kind, name: '', primary: [], holdSeconds: 30, perSide: true, technique: '', videoUrl: '' },
  })
  const name = useWatch({ control, name: 'name' })
  const noun = kind === 'exercise' ? 'упражнение' : 'растяжку'

  const next = async () => {
    if (await trigger(DRAFT_STEP_FIELDS[step])) setStep(s => s + 1)
  }

  const submit = handleSubmit(values =>
    create
      .mutateAsync({
        ...values,
        // Удержание и стороны есть только у растяжки
        holdSeconds: kind === 'stretch' ? values.holdSeconds : undefined,
        perSide: kind === 'stretch' ? values.perSide : undefined,
      })
      .then(() => onDone(values.name))
      .catch(error => {
        applyFieldErrors(error, setError)
        // Ошибка поля с прошлого шага — возвращаем туда, где её видно
        const first = Object.keys(getFieldErrors(error))[0]
        const at = DRAFT_STEP_FIELDS.findIndex(fields => fields.includes(first as keyof DraftInput))
        if (at >= 0) setStep(at)
      }),
  )

  return (
    <Screen
      key={step}
      header={
        <>
          <TopBar
            back={BACK}
            title={`Добавить ${noun}`}
            subtitle={`шаг ${step + 1} из ${STEPS.length} · ${STEPS[step]?.toLowerCase()}`}
          />
          <StepBar
            total={STEPS.length}
            current={step}
            className='px-gutter pt-3'
          />
        </>
      }
      footer={
        <StickyFooter className='grid grid-cols-[auto_1fr] gap-2'>
          <Button
            variant='outline'
            size='lg'
            disabled={step === 0}
            onClick={() => setStep(s => s - 1)}
          >
            Назад
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              size='lg'
              className='justify-between'
              onClick={() => void next()}
            >
              Дальше
              <ArrowRightIcon className='size-6' />
            </Button>
          ) : (
            <Button
              size='lg'
              className='justify-between'
              disabled={create.isPending}
              onClick={() => void submit()}
            >
              Создать
              <CheckIcon
                className='size-6'
                strokeWidth={3}
              />
            </Button>
          )}
        </StickyFooter>
      }
      className='gap-6'
    >
      <form
        className='contents'
        onSubmit={e => {
          e.preventDefault()
          if (step < STEPS.length - 1) void next()
          else void submit()
        }}
      >
        {step === 0 && (
          <>
            <Rise className='flex flex-col gap-2 px-gutter'>
              <TextField
                label='Название'
                placeholder={kind === 'exercise' ? 'Например, «Жим гантелей сидя»' : 'Например, «Растяжка груди у стены»'}
                autoFocus
                error={errors.name}
                description='Картинку добавит администратор при проверке.'
                {...register('name')}
              />
            </Rise>
            <Similar
              kind={kind}
              name={name}
            />
          </>
        )}

        {step === 1 && (
          <>
            <ScreenSection
              title={kind === 'exercise' ? 'Какие мышцы работают' : 'Какие мышцы тянет'}
              aside='хотя бы одна'
            >
              <QueryScreen
                query={muscles}
                className=''
              >
                {list => (
                  <Controller
                    control={control}
                    name='primary'
                    render={({ field }) => (
                      <ToggleGroup
                        multiple
                        value={field.value.map(String)}
                        onValueChange={values => field.onChange(values.map(Number))}
                        className='grid w-full grid-cols-2 gap-2'
                      >
                        {list.map(m => (
                          <ToggleGroupItem
                            key={m.id}
                            value={String(m.id)}
                            className='h-11 justify-start px-3'
                          >
                            {m.name}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    )}
                  />
                )}
              </QueryScreen>
              <ErrorText errors={errors.primary} />
            </ScreenSection>
            {kind === 'stretch' && (
              <ScreenSection title='Удержание'>
                <Controller
                  control={control}
                  name='holdSeconds'
                  render={({ field }) => (
                    <Segmented
                      options={HOLDS.map(h => ({ value: h, label: `${h} с` }))}
                      value={String(field.value) as (typeof HOLDS)[number]}
                      onValueChange={v => field.onChange(Number(v))}
                      size='default'
                      stretch
                    />
                  )}
                />
                <SettingRow
                  title='На каждую сторону'
                  hint='Время удваивается'
                  htmlFor='per-side'
                  className='border-t-[1.5px]'
                >
                  <Controller
                    control={control}
                    name='perSide'
                    render={({ field }) => (
                      <Switch
                        id='per-side'
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </SettingRow>
              </ScreenSection>
            )}
          </>
        )}

        {step === 2 && (
          <Rise className='flex flex-col gap-4 px-gutter'>
            <Text tone='soft'>Можно пропустить — подробности допишет администратор.</Text>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='entry-text'>{kind === 'exercise' ? 'Техника' : 'Как делать'}</Label>
              <Textarea
                id='entry-text'
                placeholder={kind === 'exercise' ? 'Ключевые пункты и типичные ошибки' : 'Исходное положение и движение'}
                aria-invalid={!!errors.technique}
                {...register('technique')}
              />
              <ErrorText errors={errors.technique} />
            </div>
            {kind === 'exercise' && (
              <TextField
                label='Ссылка на видео'
                type='url'
                inputMode='url'
                placeholder='https://'
                error={errors.videoUrl}
                {...register('videoUrl')}
              />
            )}
          </Rise>
        )}
      </form>
    </Screen>
  )
}

// Мастер своей записи справочника (frontend-tz, 11.4): при исчерпанном лимите не открывается
const NewEntryPage = () => {
  const [params] = useSearchParams()
  const kind: CatalogKind = params.get('kind') === 'stretch' ? 'stretch' : 'exercise'
  const limit = useDraftLimit()
  const [created, setCreated] = useState<string | null>(null)

  if (created) {
    return (
      <Screen
        header={
          <TopBar
            back={BACK}
            title='Готово'
          />
        }
        footer={
          <StickyFooter>
            <ButtonLink
              to={BACK}
              size='lg'
              className='w-full'
            >
              К моим записям
            </ButtonLink>
          </StickyFooter>
        }
        className='px-gutter'
      >
        <Rise>
          <Lead>черновик создан —</Lead>
          <Poster
            as='h1'
            size='3xl'
            tone='primary'
            className='mt-1 hyphens-auto'
          >
            {created}
          </Poster>
          <Text
            tone='soft'
            className='mt-4'
          >
            Уже можно ставить в комплексы — с пометкой «не проверено». Заявка ушла администратору, об исходе напишет
            бот.
          </Text>
        </Rise>
      </Screen>
    )
  }

  if (limit.data && limit.data.left <= 0) {
    return (
      <Screen
        header={
          <TopBar
            back={BACK}
            title={kind === 'exercise' ? 'Своё упражнение' : 'Своя растяжка'}
          />
        }
        className='px-gutter'
      >
        <ScreenState
          state='empty'
          title='Лимит на сегодня исчерпан'
          description={`Можно отправить ${limit.data.limit} заявок в сутки. Завтра можно снова.`}
          action={
            <ButtonLink
              to={BACK}
              variant='outline'
              size='sm'
            >
              К моим записям
            </ButtonLink>
          }
        />
      </Screen>
    )
  }

  return (
    <QueryScreen
      query={limit}
      className='m-5'
    >
      {() => (
        <Wizard
          kind={kind}
          onDone={setCreated}
        />
      )}
    </QueryScreen>
  )
}

export default NewEntryPage

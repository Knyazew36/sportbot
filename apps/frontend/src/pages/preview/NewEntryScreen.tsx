import { ArrowRightIcon, CheckIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { useState } from 'react'

import { muscleNames, normalizeName } from '@/entities/catalog/lib'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { List } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { ScreenState } from '@/shared/ui/kit/ScreenState'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { SettingRow } from '@/shared/ui/kit/SettingRow'
import { StepBar } from '@/shared/ui/kit/StepBar'
import { Lead, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'

import { DAILY_SUBMISSIONS, exercises, muscles, stretches } from './model/catalog'

const HOLDS = ['20', '30', '45', '60'] as const
const STEPS = ['Название', 'Мышцы', 'Подробности']

// «Возможно, ты искал…»: похожие по словам записи справочника, чтобы не плодить дубли (business-tz, 5.5)
const similar = (name: string, kind: 'exercise' | 'stretch') => {
  const words = normalizeName(name)
    .split(/\s+/)
    .filter(w => w.length >= 3)
  if (words.length === 0) return []
  const pool =
    kind === 'exercise'
      ? exercises.map(e => ({ id: e.id, name: e.name, imageUrl: e.imageUrl, muscles: e.primaryMuscles }))
      : stretches.map(s => ({ id: s.id, name: s.name, imageUrl: s.imageUrl, muscles: s.muscles }))
  return pool.filter(item => words.some(w => normalizeName(item.name).includes(w.slice(0, -1)))).slice(0, 3)
}

// Мастер своей записи справочника (frontend-tz, 11.4). В превью ?limit=reached показывает исчерпанный лимит
const NewEntryScreen = () => {
  const [params] = useSearchParams()
  const kind = params.get('kind') === 'stretch' ? 'stretch' : 'exercise'
  const limitReached = params.get('limit') === 'reached' || DAILY_SUBMISSIONS.used >= DAILY_SUBMISSIONS.limit
  const noun = kind === 'exercise' ? 'упражнение' : 'растяжку'

  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [name, setName] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [hold, setHold] = useState<(typeof HOLDS)[number]>('30')
  const [perSide, setPerSide] = useState(true)

  const back = `${ROUTES.PREVIEW_LIBRARY}?tab=mine`
  const matches = similar(name, kind)
  const canNext = step === 0 ? name.trim().length >= 3 : step === 1 ? picked.length > 0 : true

  if (limitReached) {
    return (
      <Screen
        header={
          <TopBar
            back={back}
            title={`Своё ${kind === 'exercise' ? 'упражнение' : 'растяжка'}`}
          />
        }
        className='px-5'
      >
        <ScreenState
          state='empty'
          title='Лимит на сегодня исчерпан'
          description={`Можно отправить ${DAILY_SUBMISSIONS.limit} заявок в сутки. Завтра можно снова.`}
          action={
            <ButtonLink
              to={back}
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

  if (done) {
    return (
      <Screen
        header={
          <TopBar
            back={back}
            title='Готово'
          />
        }
        footer={
          <StickyFooter>
            <ButtonLink
              to={back}
              size='lg'
              className='w-full'
            >
              К моим записям
            </ButtonLink>
          </StickyFooter>
        }
        className='px-5'
      >
        <Rise>
          <Lead>черновик создан —</Lead>
          <Poster
            as='h1'
            size='3xl'
            tone='primary'
            className='mt-1 hyphens-auto'
          >
            {name}
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

  return (
    <Screen
      key={step}
      header={
        <>
          <TopBar
            back={back}
            title={`Добавить ${noun}`}
            subtitle={`шаг ${step + 1} из ${STEPS.length} · ${STEPS[step]?.toLowerCase()}`}
          />
          <StepBar
            total={STEPS.length}
            current={step}
            className='px-5 pt-3'
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
              disabled={!canNext}
              onClick={() => setStep(s => s + 1)}
            >
              Дальше
              <ArrowRightIcon className='size-6' />
            </Button>
          ) : (
            <Button
              size='lg'
              className='justify-between'
              onClick={() => setDone(true)}
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
      {step === 0 && (
        <>
          <Rise className='flex flex-col gap-2 px-5'>
            <Label htmlFor='entry-name'>Название</Label>
            <Input
              id='entry-name'
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={kind === 'exercise' ? 'Например, «Жим гантелей сидя»' : 'Например, «Растяжка груди у стены»'}
              autoFocus
            />
            <Text
              size='xs'
              tone='muted'
            >
              Картинку добавит администратор при проверке.
            </Text>
          </Rise>
          {matches.length > 0 && (
            <ScreenSection
              title='Возможно, ты искал…'
              aside='уже есть в справочнике'
            >
              <List>
                {matches.map(m => (
                  <CatalogRow
                    key={m.id}
                    name={m.name}
                    imageUrl={m.imageUrl}
                    meta={muscleNames(m.muscles)}
                    to={
                      kind === 'exercise'
                        ? buildPath(ROUTES.PREVIEW_EXERCISE, { exerciseId: m.id })
                        : buildPath(ROUTES.PREVIEW_STRETCH, { stretchId: m.id })
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
          )}
        </>
      )}

      {step === 1 && (
        <>
          <ScreenSection
            title='Какие мышцы работают'
            aside='хотя бы одна'
          >
            <ToggleGroup
              multiple
              value={picked}
              onValueChange={setPicked}
              className='grid w-full grid-cols-2 gap-2'
            >
              {muscles.map(m => (
                <ToggleGroupItem
                  key={m.code}
                  value={m.code}
                  className='h-11 justify-start px-3'
                >
                  {m.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </ScreenSection>
          {kind === 'stretch' && (
            <ScreenSection title='Удержание'>
              <Segmented
                options={HOLDS.map(h => ({ value: h, label: `${h} с` }))}
                value={hold}
                onValueChange={setHold}
                size='default'
                stretch
              />
              <SettingRow
                title='На каждую сторону'
                hint='Время удваивается'
                htmlFor='per-side'
                className='border-t-[1.5px]'
              >
                <Switch
                  id='per-side'
                  checked={perSide}
                  onCheckedChange={setPerSide}
                />
              </SettingRow>
            </ScreenSection>
          )}
        </>
      )}

      {step === 2 && (
        <Rise className='flex flex-col gap-4 px-5'>
          <Text tone='soft'>Можно пропустить — подробности допишет администратор.</Text>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='entry-text'>{kind === 'exercise' ? 'Техника' : 'Как делать'}</Label>
            <Textarea
              id='entry-text'
              placeholder={kind === 'exercise' ? 'Ключевые пункты и типичные ошибки' : 'Исходное положение и движение'}
            />
          </div>
          {kind === 'exercise' && (
            <div className='flex flex-col gap-2'>
              <Label htmlFor='entry-video'>Ссылка на видео</Label>
              <Input
                id='entry-video'
                type='url'
                inputMode='url'
                placeholder='https://'
              />
            </div>
          )}
        </Rise>
      )}
    </Screen>
  )
}

export default NewEntryScreen

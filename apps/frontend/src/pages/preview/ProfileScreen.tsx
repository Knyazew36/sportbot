import { CheckIcon, ChevronRightIcon, LinkIcon, PauseIcon, PlusIcon, Share2Icon, Trash2Icon } from 'lucide-react'
import { Link } from 'react-router'

import { useState } from 'react'

import { buildPath, ROUTES } from '@/shared/config/paths'
import { BoxInput } from '@/shared/ui/kit/BoxInput'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { InkPanel } from '@/shared/ui/kit/InkPanel'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { SelectField } from '@/shared/ui/kit/SelectField'
import { SettingRow } from '@/shared/ui/kit/SettingRow'
import { StepChart } from '@/shared/ui/kit/StepChart'
import { Eyebrow, Lead, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Badge } from '@/shared/ui/shadcn/badge'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'

import { profile, WEEKDAYS } from './model/mock'
import { setTrainingSettings, useTrainingSettings } from './model/preview-settings'

const TIMEZONES = [
  { value: 'Калининград', label: 'Калининград · UTC+2' },
  { value: 'Москва', label: 'Москва · UTC+3' },
  { value: 'Самара', label: 'Самара · UTC+4' },
  { value: 'Екатеринбург', label: 'Екатеринбург · UTC+5' },
  { value: 'Новосибирск', label: 'Новосибирск · UTC+7' },
  { value: 'Владивосток', label: 'Владивосток · UTC+10' },
]

const REST = [
  { value: '60', label: '1:00' },
  { value: '90', label: '1:30' },
  { value: '120', label: '2:00' },
  { value: '180', label: '3:00' },
] as const

const WEIGHT_ASK = [
  { value: 'Выкл', label: 'Не спрашивать' },
  { value: 'Раз в неделю', label: 'Раз в неделю' },
  { value: 'Раз в две недели', label: 'Раз в две недели' },
  { value: 'Раз в месяц', label: 'Раз в месяц' },
]

const ZONES = ['Плечо', 'Локоть', 'Запястье', 'Поясница', 'Колено', 'Голеностоп'].map(z => ({ value: z, label: z }))

const weightData = profile.bodyWeight.history.map((value, i) => ({ label: `${i + 1} нед`, value }))

// ── Расписание и тренировка ─────────────────────────────────────────────────

const Schedule = () => {
  const [days, setDays] = useState<string[]>(profile.trainingDays)
  const [tz, setTz] = useState(profile.timezone)

  return (
    <ScreenSection
      variant='block'
      index={1}
      title='Расписание'
      aside={`${days.length} дня в неделю`}
    >
      <ToggleGroup
        multiple
        value={days}
        onValueChange={setDays}
        className='grid w-full grid-cols-7'
        aria-label='Тренировочные дни'
      >
        {WEEKDAYS.map(d => (
          <ToggleGroupItem
            key={d}
            value={d}
            className='h-11 px-0'
          >
            {d}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className='grid grid-cols-2 gap-3'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='morning'>Утренний вопрос</Label>
          <Input
            id='morning'
            type='time'
            defaultValue={profile.morningAt}
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='evening'>Вечерний вопрос</Label>
          <Input
            id='evening'
            type='time'
            defaultValue={profile.eveningAt}
          />
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <Label>Часовой пояс</Label>
        <SelectField
          options={TIMEZONES}
          value={tz}
          onValueChange={setTz}
          ariaLabel='Часовой пояс'
        />
      </div>
    </ScreenSection>
  )
}

const Training = () => {
  const settings = useTrainingSettings()

  return (
    <ScreenSection
      variant='block'
      index={2}
      title='Тренировка'
    >
      <SettingRow
        title='Таймер отдыха'
        hint={
          settings.showRestTimer
            ? 'Показывается после каждого подхода'
            : 'Скрыт: на экране тренировки только запись подходов'
        }
        htmlFor='rest-timer'
        className='border-t-[1.5px]'
      >
        <Switch
          id='rest-timer'
          checked={settings.showRestTimer}
          onCheckedChange={showRestTimer => setTrainingSettings({ showRestTimer })}
        />
      </SettingRow>
      {/* Остальное про таймер имеет смысл, только пока он показывается */}
      {settings.showRestTimer && (
        <>
          <div className='flex flex-col gap-2'>
            <Label>Отдых между подходами</Label>
            <Segmented
              options={REST}
              value={settings.restSeconds as (typeof REST)[number]['value']}
              onValueChange={restSeconds => setTrainingSettings({ restSeconds })}
              size='default'
              stretch
            />
          </div>
          <div>
            <SettingRow
              title='Автостарт таймера'
              hint='Отдых пойдёт сам после записи подхода'
              htmlFor='autostart'
              className='border-t-[1.5px]'
            >
              <Switch
                id='autostart'
                checked={settings.autoStartRest}
                onCheckedChange={autoStartRest => setTrainingSettings({ autoStartRest })}
              />
            </SettingRow>
            <SettingRow
              title='Звук и вибрация'
              hint='Когда таймер закончился'
              htmlFor='sound'
            >
              <Switch
                id='sound'
                checked={settings.sound}
                onCheckedChange={sound => setTrainingSettings({ sound })}
              />
            </SettingRow>
          </div>
        </>
      )}
    </ScreenSection>
  )
}

// ── Пауза и ограничения ─────────────────────────────────────────────────────

const Pause = () => {
  const [mode, setMode] = useState<'date' | 'forever'>('date')
  const [paused, setPaused] = useState(false)

  return (
    <ScreenSection
      variant='block'
      index={3}
      title='Пауза'
      aside='серия сохраняется'
    >
      {paused ? (
        <div className='hatch border-border flex items-center justify-between gap-3 border-[1.5px] p-4'>
          <div className='bg-background px-1'>
            <Poster>На паузе</Poster>
            <Text
              size='xs'
              tone='muted'
            >
              {mode === 'date' ? 'до 20 октября' : 'до отмены'}
            </Text>
          </div>
          <Button
            size='sm'
            onClick={() => setPaused(false)}
          >
            Снять
          </Button>
        </div>
      ) : (
        <>
          <Text tone='soft'>Бот замолчит, а серия не сгорит — например, на время отпуска или болезни.</Text>
          <Segmented
            options={[
              { value: 'date', label: 'До даты' },
              { value: 'forever', label: 'До отмены' },
            ]}
            value={mode}
            onValueChange={setMode}
            stretch
          />
          {mode === 'date' && (
            <Input
              type='date'
              defaultValue='2026-10-20'
              aria-label='Дата окончания паузы'
            />
          )}
          <Button
            variant='outline'
            className='w-full'
            onClick={() => setPaused(true)}
          >
            <PauseIcon />
            Поставить паузу
          </Button>
        </>
      )}
    </ScreenSection>
  )
}

const Limits = () => {
  const [limits, setLimits] = useState(profile.limits)
  const [open, setOpen] = useState(false)
  const [zone, setZone] = useState('Колено')
  const [term, setTerm] = useState<'date' | 'forever'>('date')

  return (
    <ScreenSection
      variant='block'
      index={4}
      title='Ограничения по суставам'
      aside='бот предупредит в тренировке'
    >
      {limits.length > 0 ? (
        <List>
          {limits.map(l => (
            <ListRow
              key={l.zone}
              title={l.zone}
              meta={l.until}
              trail={
                <Button
                  variant='outline'
                  size='xs'
                  onClick={() => setLimits(list => list.filter(x => x.zone !== l.zone))}
                >
                  Снять
                </Button>
              }
            />
          ))}
        </List>
      ) : (
        <Text tone='muted'>Ограничений нет. Добавь, если что-то болит — бот подскажет замену.</Text>
      )}
      <Button
        variant='outline'
        size='sm'
        className='self-start'
        onClick={() => setOpen(true)}
      >
        <PlusIcon strokeWidth={2.5} />
        Добавить ограничение
      </Button>

      <Sheet
        open={open}
        onOpenChange={setOpen}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Ограничение</SheetTitle>
            {/* Дисклеймер при включении ограничения (frontend-tz, 13.4) */}
            <SheetDescription>Это подсказка для подбора упражнений, она не заменяет врача.</SheetDescription>
          </SheetHeader>
          <div className='flex flex-col gap-4 px-gutter pb-6'>
            <div className='flex flex-col gap-2'>
              <Label>Зона</Label>
              <SelectField
                options={ZONES}
                value={zone}
                onValueChange={setZone}
                ariaLabel='Зона'
              />
            </div>
            <div className='flex flex-col gap-2'>
              <Label>Срок</Label>
              <Segmented
                options={[
                  { value: 'date', label: 'До даты' },
                  { value: 'forever', label: 'До отмены' },
                ]}
                value={term}
                onValueChange={setTerm}
                stretch
              />
              {term === 'date' && (
                <Input
                  type='date'
                  aria-label='До какой даты'
                />
              )}
            </div>
            <Button
              size='lg'
              className='w-full'
              onClick={() => {
                setLimits(list => [
                  ...list.filter(x => x.zone !== zone),
                  { zone, until: term === 'date' ? 'до даты' : 'до отмены' },
                ])
                setOpen(false)
              }}
            >
              Добавить
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </ScreenSection>
  )
}

// ── Вес тела ────────────────────────────────────────────────────────────────

const BodyWeight = () => {
  const [ask, setAsk] = useState(profile.weightAsk)

  return (
    <ScreenSection
      variant='block'
      index={5}
      title='Вес тела'
      aside={`последний ${profile.bodyWeight.last} кг`}
    >
      <div className='grid grid-cols-[1fr_auto] gap-2'>
        <BoxInput
          label='сегодня, кг'
          placeholder={profile.bodyWeight.last}
        />
        <Button className='h-auto px-4'>
          <CheckIcon
            className='size-5'
            strokeWidth={3}
          />
          Записать
        </Button>
      </div>
      <StepChart
        data={weightData}
        unit='кг'
        curve='line'
        tickEvery={1}
        className='-mx-2 h-[150px]'
      />
      <div className='flex flex-col gap-2'>
        <Label>Бот спрашивает вес</Label>
        <SelectField
          options={WEIGHT_ASK}
          value={ask}
          onValueChange={setAsk}
          ariaLabel='Как часто бот спрашивает вес'
        />
      </div>
    </ScreenSection>
  )
}

// ── Друзья и мессенджеры ────────────────────────────────────────────────────

const Friends = () => {
  // Системное «Поделиться» со ссылкой-приглашением на бота (frontend-tz, 13.6)
  const invite = () =>
    void navigator.share?.({ title: 'Спортбот', url: 'https://t.me/sportbot?start=invite' }).catch(() => undefined)

  return (
    <ScreenSection
      variant='block'
      index={6}
      title='Друзья'
      aside={`${profile.friends.length} в списке`}
    >
      <List>
        {profile.friends.map(f => (
          <ListRow
            key={f.id}
            lead={f.streak}
            title={
              <Link
                to={buildPath(ROUTES.PREVIEW_FRIEND, { friendId: f.id })}
                className='underline-offset-4 after:absolute after:inset-0 hover:underline'
              >
                {f.name}
              </Link>
            }
            className='relative'
            meta={f.paused ? 'на паузе' : `серия ${f.streak} дн`}
            trail={<ChevronRightIcon className='text-foreground/40 size-5' />}
          >
            {f.trainedToday && (
              <Badge
                variant='secondary'
                className='mt-2'
              >
                <CheckIcon />
                сегодня тренировался
              </Badge>
            )}
          </ListRow>
        ))}
      </List>
      <Button
        className='w-full'
        onClick={invite}
      >
        <Share2Icon />
        Пригласить друга
      </Button>
    </ScreenSection>
  )
}

const Messengers = () => {
  const [notifyTo, setNotifyTo] = useState(profile.notifyTo)
  const [codeOpen, setCodeOpen] = useState(false)

  return (
    <ScreenSection
      variant='block'
      index={7}
      title='Мессенджеры'
    >
      <List>
        {profile.messengers.map(m => (
          <ListRow
            key={m.name}
            title={m.name}
            meta={m.linked ? 'привязан' : 'не привязан'}
            trail={
              m.linked ? (
                <Badge>
                  <CheckIcon />
                  привязан
                </Badge>
              ) : (
                <Button
                  variant='outline'
                  size='xs'
                  onClick={() => setCodeOpen(true)}
                >
                  <LinkIcon />
                  Привязать
                </Button>
              )
            }
          />
        ))}
      </List>
      <div className='flex flex-col gap-2'>
        <Label>Куда присылать вопросы и напоминания</Label>
        <Segmented
          options={['Telegram', 'MAX', 'Оба']}
          value={notifyTo}
          onValueChange={setNotifyTo}
          stretch
        />
      </div>

      {/* Привязка второго мессенджера по коду, как в боте */}
      <Sheet
        open={codeOpen}
        onOpenChange={setCodeOpen}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Привязать MAX</SheetTitle>
            <SheetDescription>
              Отправь этот код боту в MAX — аккаунты объединятся, история останется одна.
            </SheetDescription>
          </SheetHeader>
          <div className='flex flex-col gap-4 px-gutter pb-6'>
            <InkPanel className='py-6 text-center'>
              <Eyebrow
                as='p'
                tone='inverseMuted'
              >
                код действует 10 минут
              </Eyebrow>
              <Poster
                size='4xl'
                className='mt-2 tracking-[0.08em]'
              >
                483 921
              </Poster>
            </InkPanel>
            <Button
              variant='outline'
              className='w-full'
              onClick={() => setCodeOpen(false)}
            >
              Готово
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </ScreenSection>
  )
}

// ── Удаление данных ─────────────────────────────────────────────────────────

const DeleteData = () => (
  <ScreenSection
    variant='block'
    index={8}
    title='Удаление данных'
  >
    <div className='border-destructive/60 flex flex-col gap-3 border-[1.5px] border-dashed p-4'>
      <div className='grid grid-cols-2 gap-3'>
        <div>
          <Eyebrow
            as='p'
            tone='danger'
            className='mb-1.5'
          >
            Сотрётся
          </Eyebrow>
          <Text
            as='ul'
            size='xs'
            tone='soft'
            className='flex flex-col gap-1'
          >
            <li>тренировки и веса</li>
            <li>программы и черновики</li>
            <li>вес тела, ограничения</li>
            <li>друзья</li>
          </Text>
        </div>
        <div>
          <Eyebrow
            as='p'
            className='mb-1.5'
          >
            Останется
          </Eyebrow>
          <Text
            as='ul'
            size='xs'
            tone='soft'
            className='flex flex-col gap-1'
          >
            <li>упражнения, которые ты отдал в общий справочник — без имени</li>
          </Text>
        </div>
      </div>
      <ConfirmAction
        trigger={
          <Button
            variant='destructive'
            className='w-full'
          />
        }
        title='Удалить все данные?'
        description='Это не отменить. После удаления приложение начнётся с первого запуска.'
        confirmLabel='Удалить навсегда'
        confirmWord='удалить'
        onConfirm={() => undefined}
      >
        <Trash2Icon />
        Удалить мои данные
      </ConfirmAction>
    </div>
  </ScreenSection>
)

// Профиль: все настройки на одном экране секциями (frontend-tz, раздел 13)
const ProfileScreen = () => (
  <Screen
    header={
      <ScreenHeader
        title='Профиль'
        aside={profile.since}
      />
    }
    className='gap-12'
  >
    <Rise className='flex items-end justify-between gap-4 px-gutter'>
      <div className='min-w-0'>
        <Lead>привет,</Lead>
        <Poster
          as='h1'
          size='4xl'
          tone='primary'
          fit
        >
          {profile.name}
        </Poster>
      </div>
      <div className='border-foreground/80 shrink-0 border-[1.5px] px-3 py-2 text-center'>
        <Eyebrow as='p'>серия</Eyebrow>
        <Poster
          size='2xl'
          tone='primary'
        >
          {profile.streak}
        </Poster>
      </div>
    </Rise>

    <Schedule />
    <Training />
    <Pause />
    <Limits />
    <BodyWeight />
    <Friends />
    <Messengers />
    <DeleteData />
  </Screen>
)

export default ProfileScreen

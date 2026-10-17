import { ArrowRightIcon, CheckIcon, PencilIcon, PlusIcon, Trash2Icon, TriangleAlertIcon } from 'lucide-react'

import { type ReactNode, useState } from 'react'

import { ROUTES } from '@/shared/config/paths'
import { BarbellArt, MedalArt, StretchArt } from '@/shared/ui/kit/Art'
import { BoxInput } from '@/shared/ui/kit/BoxInput'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { CatalogImage } from '@/shared/ui/kit/CatalogImage'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { FileDrop } from '@/shared/ui/kit/FileDrop'
import { InkPanel } from '@/shared/ui/kit/InkPanel'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { OptionButton } from '@/shared/ui/kit/OptionButton'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Ring } from '@/shared/ui/kit/Ring'
import { Screen } from '@/shared/ui/kit/Screen'
import { ScreenHeader, TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { ScreenState } from '@/shared/ui/kit/ScreenState'
import { SearchField } from '@/shared/ui/kit/SearchField'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { SelectField } from '@/shared/ui/kit/SelectField'
import { SettingRow } from '@/shared/ui/kit/SettingRow'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { StepBar } from '@/shared/ui/kit/StepBar'
import { StepChart } from '@/shared/ui/kit/StepChart'
import { StepList } from '@/shared/ui/kit/StepList'
import { Ticket } from '@/shared/ui/kit/Ticket'
import { TimerButton } from '@/shared/ui/kit/TimerButton'
import { Eyebrow, Lead, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Badge } from '@/shared/ui/shadcn/badge'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'

import { exercises } from './model/catalog'
import { stats } from './model/mock'
import { TypographySpecimen } from './ui-kit/TypographySpecimen'

const VARIANTS = ['default', 'ink', 'outline', 'alert', 'paper', 'destructive'] as const

// Образец компонента: где лежит и как выглядит
const Sample = ({ path, children }: { path: string; children: ReactNode }) => (
  <div className='flex flex-col gap-3'>
    <code className='text-muted-foreground font-mono text-[11px]'>{path}</code>
    {children}
  </div>
)

// Витрина кита Mini App: всё, из чего собираются экраны, в теме Спортбота
const UiKitScreen = () => {
  const [segment, setSegment] = useState('3 мес')
  const [days, setDays] = useState(['Пн', 'Чт'])
  const [switchOn, setSwitchOn] = useState(true)
  const [select, setSelect] = useState('bench')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [query, setQuery] = useState('')

  return (
    <Screen
      header={
        <ScreenHeader
          title='UI-кит'
          aside='shared/ui'
        />
      }
      className='gap-12'
    >
      <Rise className='px-gutter'>
        <Lead>из чего собран</Lead>
        <Poster
          as='h1'
          size='5xl'
          tone='primary'
          fit
        >
          Спортбот
        </Poster>
        <Text
          tone='soft'
          className='mt-3'
        >
          Тема и примитивы — <code className='font-mono text-[12px]'>shared/ui/shadcn</code>, блоки экранов —{' '}
          <code className='font-mono text-[12px]'>shared/ui/kit</code>, оболочка —{' '}
          <code className='font-mono text-[12px]'>widgets/miniapp</code>.
        </Text>
      </Rise>

      <TypographySpecimen />

      <ScreenSection
        title='07 · Кнопки'
        aside='тень = нажимается'
      >
        <Sample path='shadcn/animate-ui/components/buttons/button'>
          <div className='flex flex-wrap gap-3'>
            {VARIANTS.map(v => (
              <Button
                key={v}
                variant={v}
                size='sm'
              >
                {v}
              </Button>
            ))}
          </div>
          <InkPanel className='p-4'>
            <Button variant='paper'>paper на чёрном</Button>
          </InkPanel>
          <div className='flex flex-col gap-3'>
            <Button
              size='xl'
              className='w-full justify-between'
            >
              xl · главное
              <ArrowRightIcon
                className='size-7'
                strokeWidth={2.5}
              />
            </Button>
            <Button
              variant='ink'
              size='lg'
              className='w-full'
            >
              lg · ink
            </Button>
            <div className='flex flex-wrap items-center gap-3'>
              <Button>default</Button>
              <Button
                variant='outline'
                size='sm'
              >
                <PlusIcon />
                sm
              </Button>
              <Button
                variant='outline'
                size='xs'
              >
                xs
              </Button>
              <Button
                variant='outline'
                size='icon'
                aria-label='Иконка'
              >
                <PencilIcon />
              </Button>
              <Button
                variant='alert'
                size='sm'
              >
                <TriangleAlertIcon />
                предупреждение
              </Button>
              <Button
                size='sm'
                disabled
              >
                disabled
              </Button>
            </div>
          </div>
        </Sample>
        <Sample path='kit/ButtonLink'>
          <ButtonLink
            to={ROUTES.PREVIEW_TODAY}
            variant='outline'
          >
            Ссылка в облике кнопки
          </ButtonLink>
        </Sample>
      </ScreenSection>

      <ScreenSection title='08 · Поля'>
        <Sample path='shadcn/label + shadcn/input'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='kit-input'>Название программы</Label>
            <Input
              id='kit-input'
              placeholder='Сила. Сплит на 3 дня'
            />
          </div>
        </Sample>
        <Sample path='kit/BoxInput'>
          <div className='grid grid-cols-2 gap-2'>
            <BoxInput
              label='вес, кг'
              placeholder='22'
            />
            <BoxInput
              label='повторы'
              placeholder='8'
            />
          </div>
        </Sample>
        <Sample path='kit/SelectField'>
          <SelectField
            options={[
              { value: 'bench', label: 'Жим штанги лёжа' },
              { value: 'squat', label: 'Приседания со штангой' },
            ]}
            value={select}
            onValueChange={setSelect}
            ariaLabel='Упражнение'
          />
        </Sample>
      </ScreenSection>

      <ScreenSection title='09 · Выбор'>
        <Sample path='kit/Segmented'>
          <Segmented
            options={['1 мес', '3 мес', 'Год']}
            value={segment}
            onValueChange={setSegment}
          />
        </Sample>
        <Sample path='shadcn/toggle-group · multiple'>
          <ToggleGroup
            multiple
            value={days}
            onValueChange={setDays}
            className='grid w-full grid-cols-7'
          >
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
              <ToggleGroupItem
                key={d}
                value={d}
                className='h-11 px-0'
              >
                {d}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Sample>
        <Sample path='kit/SettingRow + animate-ui/components/radix/switch'>
          <SettingRow
            title='Автостарт таймера'
            hint='Отдых пойдёт сам после записи подхода'
            htmlFor='kit-switch'
            className='border-t-[1.5px]'
          >
            <Switch
              id='kit-switch'
              checked={switchOn}
              onCheckedChange={setSwitchOn}
            />
          </SettingRow>
        </Sample>
        <Sample path='shadcn/badge'>
          <div className='flex flex-wrap gap-2'>
            <Badge>default</Badge>
            <Badge variant='secondary'>secondary</Badge>
            <Badge variant='outline'>не проверено</Badge>
            <Badge variant='destructive'>destructive</Badge>
            <Badge>
              <CheckIcon />с иконкой
            </Badge>
          </div>
        </Sample>
      </ScreenSection>

      <ScreenSection title='10 · Шапки'>
        <Sample path='kit/ScreenHeader · ScreenHeader'>
          <div className='border-border -mx-gutter border-y-[1.5px]'>
            <ScreenHeader
              title='Вторник · 13 октября'
              aside='день 47'
            />
          </div>
        </Sample>
        <Sample path='kit/ScreenHeader · TopBar'>
          <div className='border-border relative -mx-gutter border-y-[1.5px]'>
            <TopBar
              back={ROUTES.PREVIEW_TODAY}
              title='Грудь и трицепс'
              subtitle='упражнение 2 из 6 · 23:41'
              action={
                <Button
                  variant='ink'
                  size='sm'
                >
                  Завершить
                </Button>
              }
            />
          </div>
        </Sample>
      </ScreenSection>

      <ScreenSection
        title='11 · Блоки'
        aside='kit/ScreenSection — заголовок секции'
      >
        <Sample path='kit/StatGrid'>
          <StatGrid
            items={[
              { label: 'упражнений', value: 6 },
              { label: 'подходов', value: 19 },
              { label: 'минут', value: '~55' },
            ]}
          />
          <StatGrid
            framed
            items={[
              { label: 'подходов', value: 17 },
              { label: 'упражнений', value: '6/6' },
              { label: 'серия', value: '13 дн' },
            ]}
          />
        </Sample>
        <Sample path='kit/ListRow'>
          <List>
            <ListRow
              lead='01'
              title='Жим штанги лёжа'
              meta='Грудь · трицепс'
              trail={<Poster as='span'>4 × 8–12</Poster>}
            />
            <ListRow
              lead='02'
              title='Жим гантелей на наклонной'
              meta='Верх груди · дельты'
              trail={
                <Button
                  variant='outline'
                  size='icon-sm'
                  aria-label='Удалить'
                >
                  <Trash2Icon />
                </Button>
              }
            >
              <Badge
                variant='outline'
                className='mt-2'
              >
                не проверено
              </Badge>
            </ListRow>
          </List>
        </Sample>
        <Sample path='kit/Ticket'>
          <div className='no-scrollbar -mx-gutter flex gap-2 overflow-x-auto px-gutter'>
            <Ticket
              mark='A'
              title='Грудь и трицепс'
              active
            />
            <Ticket
              mark='B'
              title='Спина и бицепс'
            />
          </div>
        </Sample>
        <Sample path='kit/InkPanel'>
          <InkPanel className='p-4'>
            <Eyebrow
              as='p'
              tone='inverseMuted'
            >
              Серия сейчас
            </Eyebrow>
            <Poster
              size='4xl'
              numeric
              className='mt-2'
            >
              12
            </Poster>
          </InkPanel>
        </Sample>
      </ScreenSection>

      <ScreenSection title='12 · Данные'>
        <Sample path='kit/Ring'>
          <div className='flex items-center gap-4'>
            <Ring
              value={0.62}
              size={120}
              stroke={5}
            />
            <Ring
              value={0.3}
              size={80}
              stroke={4}
              ticks={false}
            />
          </div>
        </Sample>
        <Sample path='kit/StepChart'>
          <StepChart
            data={stats.weightProgress.map(p => ({ label: p.date, value: p.value }))}
            unit='кг'
            className='-mx-2'
          />
        </Sample>
      </ScreenSection>

      <ScreenSection title='13 · Справочник'>
        <Sample path='kit/SearchField'>
          <SearchField
            value={query}
            onValueChange={setQuery}
            placeholder='Название упражнения'
          />
        </Sample>
        <Sample path='kit/CatalogImage · миниатюра, заглушка, обложка'>
          <div className='flex gap-3'>
            <CatalogImage
              src={exercises[0]!.imageUrl}
              alt=''
            />
            <CatalogImage
              src={null}
              alt=''
            />
          </div>
          <CatalogImage
            src={null}
            alt=''
            size='cover'
          />
        </Sample>
        <Sample path='widgets/catalog/CatalogRow'>
          <List>
            <CatalogRow
              name={exercises[0]!.name}
              imageUrl={exercises[0]!.imageUrl}
              meta='Грудь · Штанга'
            />
            <CatalogRow
              name='Молотки с гантелями сидя'
              imageUrl={null}
              meta='Бицепс · Предплечья'
              draft
            />
          </List>
        </Sample>
        <Sample path='kit/FileDrop'>
          <FileDrop
            accept='image/*'
            title='Загрузить картинку'
            hint='JPEG, PNG или WebP, до 5 МБ'
            onFile={() => undefined}
          />
        </Sample>
      </ScreenSection>

      <ScreenSection title='14 · Шаги и таймеры'>
        <Sample path='kit/StepBar'>
          <StepBar
            total={3}
            current={1}
          />
        </Sample>
        <Sample path='kit/TimerButton'>
          <div className='flex gap-4'>
            <TimerButton
              left={14}
              total={30}
              paused={false}
              onToggle={() => undefined}
            />
            <TimerButton
              left={22}
              total={30}
              paused
              onToggle={() => undefined}
            />
          </div>
        </Sample>
        <Sample path='kit/StepList'>
          <StepList
            items={[
              'Встань боком к стене, ладонь на уровне плеча',
              'Медленно поворачивай корпус от стены',
              'Плечо не поднимай, дыши ровно',
            ]}
            size='lg'
          />
        </Sample>
        <Sample path='kit/OptionButton'>
          <div className='flex flex-col gap-2'>
            <OptionButton
              mark='A'
              title='Грудь и трицепс'
              meta='6 упражнений · на очереди'
              selected
            />
            <OptionButton
              mark='B'
              title='Широчайшие, задние дельты и бицепс'
              meta='5 упражнений'
            />
          </div>
        </Sample>
      </ScreenSection>

      <ScreenSection title='15 · Иллюстрации'>
        <Sample path='kit/Art'>
          <BarbellArt />
          <div className='grid grid-cols-2 items-end gap-4'>
            <StretchArt />
            <MedalArt />
          </div>
        </Sample>
      </ScreenSection>

      <ScreenSection title='16 · Окна'>
        <Sample path='shadcn/sheet · side=bottom'>
          <Button
            variant='outline'
            onClick={() => setSheetOpen(true)}
          >
            Открыть шторку
          </Button>
          <Sheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
          >
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Шторка</SheetTitle>
                <SheetDescription>Снизу у большого пальца: списки, выбор, короткие формы.</SheetDescription>
              </SheetHeader>
              <div className='px-gutter pb-6'>
                <Button
                  className='w-full'
                  onClick={() => setSheetOpen(false)}
                >
                  Понятно
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </Sample>
        <Sample path='kit/ConfirmAction · confirmWord'>
          <div className='flex flex-wrap gap-3'>
            <ConfirmAction
              trigger={
                <Button
                  variant='destructive'
                  size='sm'
                />
              }
              title='Удалить комплекс?'
              description='История тренировок сохранится.'
              confirmLabel='Удалить'
              onConfirm={() => undefined}
            >
              Удалить
            </ConfirmAction>
            <ConfirmAction
              trigger={
                <Button
                  variant='destructive'
                  size='sm'
                />
              }
              title='Удалить все данные?'
              description='Введите слово, чтобы подтвердить.'
              confirmLabel='Удалить навсегда'
              confirmWord='удалить'
              onConfirm={() => undefined}
            >
              С вводом слова
            </ConfirmAction>
          </div>
        </Sample>
      </ScreenSection>

      <ScreenSection
        title='17 · Состояния'
        aside='frontend-tz, 15'
      >
        <Sample path='kit/ScreenState'>
          <ScreenState
            state='loading'
            rows={2}
          />
          <ScreenState
            state='empty'
            title='Программ пока нет'
            description='Возьми шаблон или собери свою с нуля.'
            action={
              <Button
                variant='outline'
                size='sm'
              >
                К шаблонам
              </Button>
            }
          />
          <ScreenState
            state='error'
            action={<Button size='sm'>Повторить</Button>}
          />
        </Sample>
      </ScreenSection>
    </Screen>
  )
}

export default UiKitScreen

import type { StatsE1rmResponseDto, StatsE1rmSetResponseDto } from '@/shared/api/generated/model'
import { formatDate } from '@/shared/lib/format'
import { StepChart } from '@/shared/ui/kit/StepChart'
import { Eyebrow, Poster, Text, Unit } from '@/shared/ui/kit/Typography'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

/** Дальше этого числа повторов оценка заметно грубее — предупреждаем рядом с числом */
export const ROUGH_REPS = 10

export const kg = (value: number) => value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })

type E1rmSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  e1rm: StatsE1rmResponseDto
  /** «за 3 месяца» */
  periodText: string
}

const Estimate = ({ label, set }: { label: string; set: StatsE1rmSetResponseDto }) => (
  <div>
    <Eyebrow as='p'>{label}</Eyebrow>
    <Poster
      size='2xl'
      numeric
      fit
      className='mt-1'
    >
      <span className='text-primary'>≈</span>
      {kg(set.value)}
      <Unit>кг</Unit>
    </Poster>
    <Text
      size='xs'
      tone='muted'
      className='mt-1'
    >
      по подходу {kg(set.weight)} кг × {set.reps}
      {set.reps > ROUGH_REPS && ' — много повторов, оценка грубая'}
    </Text>
  </div>
)

// Расчётный 1ПМ: оценка, а не замер, поэтому рядом всегда объяснение, как он считается и насколько ошибается
export const E1rmSheet = ({ open, onOpenChange, e1rm, periodText }: E1rmSheetProps) => (
  <Sheet
    open={open}
    onOpenChange={onOpenChange}
  >
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Расчётный 1ПМ</SheetTitle>
        <Eyebrow tone='primary'>оценка, не замер</Eyebrow>
      </SheetHeader>
      <div className='px-gutter flex min-h-0 flex-col gap-5 overflow-y-auto pb-5'>
        <div className='grid grid-cols-2 gap-4'>
          {e1rm.best && (
            <Estimate
              label={`Лучший ${periodText}`}
              set={e1rm.best}
            />
          )}
          {e1rm.current && (
            <Estimate
              label='Последняя тренировка'
              set={e1rm.current}
            />
          )}
        </div>
        {e1rm.points.length > 1 && (
          <StepChart
            data={e1rm.points.map(p => ({ label: formatDate(p.date, 'd MMM'), value: p.value }))}
            unit='кг'
            curve='line'
            className='-mx-2'
          />
        )}
        <div className='flex flex-col gap-2'>
          <Eyebrow as='p'>Как считается</Eyebrow>
          <Text size='sm'>
            1ПМ — вес, который можно поднять один раз. Здесь он не измерен, а оценён по формуле Эпли: вес × (1 +
            повторы / 30). Из подходов тренировки берётся самая высокая оценка.
          </Text>
        </div>
        <div className='flex flex-col gap-2'>
          <Eyebrow as='p'>Насколько точно</Eyebrow>
          <ul className='flex list-disc flex-col gap-1.5 pl-5'>
            <Text
              as='li'
              size='sm'
            >
              Формула считает, что подход сделан до отказа. Если в запасе оставались повторы, оценка занижена.
            </Text>
            <Text
              as='li'
              size='sm'
            >
              Точнее всего — на подходах до 10 повторов. Чем больше повторов, тем больше разброс, а на 15 и больше
              формула обычно завышает максимум.
            </Text>
            <Text
              as='li'
              size='sm'
            >
              Точность зависит от упражнения, опыта и пола: исследования показывают, что у новичков формула обычно
              немного занижает результат.
            </Text>
            <Text
              as='li'
              size='sm'
            >
              Смотри на динамику, а не на одно число: если оценка растёт от тренировки к тренировке, сила растёт.
            </Text>
            <Text
              as='li'
              size='sm'
            >
              Это не рабочий вес: проверять максимум на одно повторение — только с разминкой и страховкой.
            </Text>
          </ul>
        </div>
      </div>
    </SheetContent>
  </Sheet>
)

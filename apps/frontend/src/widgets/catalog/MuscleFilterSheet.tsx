import { useState } from 'react'

import { MUSCLE_GROUPS, muscleGroupOf } from '@/entities/catalog'
import { cn } from '@/shared/lib/utils'
import { BodyMap } from '@/shared/ui/kit/BodyMap'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

type MuscleFilterSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Мышцы справочника: code и название */
  muscles: readonly { code: string; name: string }[]
  /** Выбранные мышцы — коды */
  value: readonly string[]
  onApply: (codes: string[]) => void
  /** Подпись кнопки по черновику выбора: «Показать 42 упражнения» */
  showLabel?: (codes: string[]) => string
}

// Фильтр по мышцам для тех, кто не знает их названий: тап по телу или по группе, под группой — мышцы
// с подсказкой простыми словами. Выбор копится в черновике и применяется кнопкой, список под шторкой не мигает
export const MuscleFilterSheet = ({
  open,
  onOpenChange,
  muscles,
  value,
  onApply,
  showLabel,
}: MuscleFilterSheetProps) => (
  <Sheet
    open={open}
    onOpenChange={onOpenChange}
  >
    {/* Две фигуры и списки мышц не влезают в обычные 88% — шторке можно до 95% высоты */}
    <SheetContent className='data-[side=bottom]:max-h-[min(95svh,var(--sheet-ceiling))]'>
      {/* Новый черновик на каждое открытие: закрыли без «Показать» — выбор не меняется */}
      {open && (
        <Draft
          muscles={muscles}
          value={value}
          showLabel={showLabel}
          onApply={codes => {
            onApply(codes)
            onOpenChange(false)
          }}
        />
      )}
    </SheetContent>
  </Sheet>
)

const Draft = ({
  muscles,
  value,
  onApply,
  showLabel = () => 'Показать',
}: Omit<MuscleFilterSheetProps, 'open' | 'onOpenChange'>) => {
  const [codes, setCodes] = useState<string[]>([...value])
  const firstGroup = value[0] ? muscleGroupOf(value[0])?.label : undefined
  const [focus, setFocus] = useState<string | undefined>(firstGroup)

  const names = Object.fromEntries(muscles.map(m => [m.code, m.name]))
  // Мышцы по отдельности — у каждой группы, где что-то выбрано, и у последней нажатой.
  // Только у последней — список пропадал, стоило нажать группу из одной мышцы («Пресс»)
  const expanded = MUSCLE_GROUPS.filter(
    g => g.codes.length > 1 && (g.label === focus || g.codes.some(c => codes.includes(c))),
  )

  const toggle = (code: string) => {
    setCodes(prev => (prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]))
    setFocus(muscleGroupOf(code)?.label)
  }

  // Группа целиком: не все выбраны — выбрать все, все — снять
  const toggleGroup = (label: string) => {
    const group = MUSCLE_GROUPS.find(g => g.label === label)
    if (!group) return
    const all = group.codes.every(c => codes.includes(c))
    setCodes(prev => (all ? prev.filter(c => !group.codes.includes(c)) : [...new Set([...prev, ...group.codes])]))
    setFocus(label)
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>Какие мышцы?</SheetTitle>
      </SheetHeader>

      <div className='px-gutter flex min-h-0 flex-col gap-4 overflow-y-auto pt-1'>
        {/* Спереди и сзади рядом: крутить тело не нужно, фигуры во всю ширину шторки — по ним легко попасть */}
        <div className='grid grid-cols-2 gap-3'>
          {(['front', 'back'] as const).map(side => (
            <figure
              key={side}
              className='flex flex-col items-center gap-1'
            >
              <BodyMap
                side={side}
                selected={codes}
                onToggle={toggle}
                className='w-full'
              />
              <Text
                as='figcaption'
                size='xs'
                tone='muted'
              >
                {side === 'front' ? 'спереди' : 'сзади'}
              </Text>
            </figure>
          ))}
        </div>

        <div className='grid grid-cols-3 gap-2'>
          {MUSCLE_GROUPS.map(g => {
            const picked = g.codes.filter(c => codes.includes(c)).length
            const all = picked === g.codes.length
            return (
              <Button
                key={g.label}
                type='button'
                variant={all ? 'default' : 'outline'}
                aria-pressed={all}
                className={cn(
                  'h-11',
                  focus === g.label && !all && 'border-primary',
                  picked > 0 && !all && 'bg-sb-tint',
                )}
                onClick={() => toggleGroup(g.label)}
              >
                {g.label}
              </Button>
            )
          })}
        </div>

        {expanded.map(group => (
          <div
            key={group.label}
            className='flex flex-col gap-2'
          >
            <Eyebrow as='p'>{group.label} — по отдельности</Eyebrow>
            <div className='grid grid-cols-2 gap-2'>
              {group.codes.map(code => {
                const on = codes.includes(code)
                return (
                  <Button
                    key={code}
                    type='button'
                    variant={on ? 'default' : 'outline'}
                    aria-pressed={on}
                    className='h-11 justify-start text-left'
                    onClick={() => toggle(code)}
                  >
                    <span className='truncate'>{names[code] ?? code}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        ))}

        {!focus && (
          <Text
            size='sm'
            tone='muted'
          >
            Нажми на мышцу на теле или выбери группу.
          </Text>
        )}
      </div>

      <div className='px-gutter flex gap-2 pt-4 pb-6'>
        {codes.length > 0 && (
          <Button
            type='button'
            variant='outline'
            className='shrink-0'
            // Сброс сразу применяется и закрывает шторку — «Показать» после него лишний шаг
            onClick={() => onApply([])}
          >
            Сбросить
          </Button>
        )}
        <Button
          type='button'
          className='min-w-0 flex-1'
          onClick={() => onApply(codes)}
        >
          {showLabel(codes)}
        </Button>
      </div>
    </>
  )
}

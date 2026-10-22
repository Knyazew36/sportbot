import { ChevronDownIcon, XIcon } from 'lucide-react'

import { useState } from 'react'

import { type Equipment, EQUIPMENT_LABEL, MUSCLE_GROUPS } from '@/entities/catalog'
import { cn } from '@/shared/lib/utils'
import { SearchField } from '@/shared/ui/kit/SearchField'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { EquipmentFilterSheet } from './EquipmentFilterSheet'
import { MuscleFilterSheet } from './MuscleFilterSheet'

// Чипы делят строку поровну: длинная подпись («Передние дельты») режется многоточием, а не выталкивает соседей
const chip = (active: boolean) =>
  cn(
    'bg-card h-9 min-w-0 flex-1 justify-between rounded-full px-3.5',
    active && 'bg-foreground text-background [&_svg]:text-background!',
  )

/** Подпись чипа: одна группа целиком — её название, одна мышца — её, иначе счётчик */
const musclesLabel = (codes: readonly string[], names: Record<string, string>) => {
  if (codes.length === 0) return 'Мышцы'
  const group = MUSCLE_GROUPS.find(g => g.codes.length === codes.length && g.codes.every(c => codes.includes(c)))
  if (group) return group.label
  if (codes.length === 1) return names[codes[0]!] ?? 'Мышцы · 1'
  return `Мышцы · ${codes.length}`
}

type CatalogFilterBarProps = {
  query: string
  onQueryChange: (query: string) => void
  muscles: readonly { code: string; name: string }[]
  /** Выбранные мышцы — коды */
  muscleCodes: readonly string[]
  onMuscleCodesChange: (codes: string[]) => void
  /** Фильтр инвентаря есть только у упражнений — у растяжек его не передаём */
  equipment?: Equipment | 'ALL'
  onEquipmentChange?: (equipment: Equipment | 'ALL') => void
  /** Крестик: снять мышцы и инвентарь одним изменением. Двумя подряд второе затирало бы первое в адресе */
  onReset: () => void
  placeholder?: string
  /** Подпись кнопки шторки мышц по черновику: «Показать 42 упражнения» */
  showLabel?: (codes: string[]) => string
}

// Поиск и одна строка чипов над справочником: список начинается сразу под ними.
// Каждый чип открывает свою шторку: мышцы — с картой тела, инвентарь — с подсказками
export const CatalogFilterBar = ({
  query,
  onQueryChange,
  muscles,
  muscleCodes,
  onMuscleCodesChange,
  equipment,
  onEquipmentChange,
  onReset,
  placeholder = 'Название упражнения',
  showLabel,
}: CatalogFilterBarProps) => {
  const [opened, setOpened] = useState<'muscles' | 'equipment' | null>(null)
  const names = Object.fromEntries(muscles.map(m => [m.code, m.name]))
  const withEquipment = equipment !== undefined && onEquipmentChange
  const active = muscleCodes.length > 0 || (withEquipment && equipment !== 'ALL')
  const close = (open: boolean) => !open && setOpened(null)

  return (
    <div className='flex flex-col gap-2.5'>
      <SearchField
        value={query}
        onValueChange={onQueryChange}
        placeholder={placeholder}
      />
      <div className='flex gap-2'>
        <Button
          type='button'
          variant='outline'
          className={chip(muscleCodes.length > 0)}
          onClick={() => setOpened('muscles')}
        >
          <span className='truncate'>{musclesLabel(muscleCodes, names)}</span>
          <ChevronDownIcon />
        </Button>
        {withEquipment && (
          <Button
            type='button'
            variant='outline'
            className={chip(equipment !== 'ALL')}
            onClick={() => setOpened('equipment')}
          >
            <span className='truncate'>{equipment === 'ALL' ? 'Инвентарь' : EQUIPMENT_LABEL[equipment]}</span>
            <ChevronDownIcon />
          </Button>
        )}
        {/* Сброс — квадратом с крестиком: со словом «Сбросить» строка не влезала в 320px */}
        {active && (
          <Button
            type='button'
            variant='outline'
            size='icon'
            className='size-9 shrink-0 rounded-full'
            aria-label='Сбросить фильтры'
            onClick={onReset}
          >
            <XIcon />
          </Button>
        )}
      </div>

      <MuscleFilterSheet
        open={opened === 'muscles'}
        onOpenChange={close}
        muscles={muscles}
        value={muscleCodes}
        onApply={onMuscleCodesChange}
        showLabel={showLabel}
      />
      {withEquipment && (
        <EquipmentFilterSheet
          open={opened === 'equipment'}
          onOpenChange={close}
          value={equipment}
          onValueChange={onEquipmentChange}
        />
      )}
    </div>
  )
}

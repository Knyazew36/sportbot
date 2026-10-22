import { useState } from 'react'

import { type Equipment, EQUIPMENT_LABEL } from '@/entities/catalog'
import { BodyMap } from '@/shared/ui/kit/BodyMap'
import { CountBadge } from '@/shared/ui/kit/CountBadge'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CatalogFilterBar } from '@/widgets/catalog/CatalogFilterBar'

// Мышцы как в сиде сервера: демо работает без входа и без API
const MUSCLES = [
  { code: 'traps', name: 'Трапеции' },
  { code: 'front-delts', name: 'Передние дельты' },
  { code: 'mid-delts', name: 'Средние дельты' },
  { code: 'rear-delts', name: 'Задние дельты' },
  { code: 'chest', name: 'Грудь' },
  { code: 'lats', name: 'Широчайшие' },
  { code: 'biceps', name: 'Бицепс' },
  { code: 'triceps', name: 'Трицепс' },
  { code: 'forearms', name: 'Предплечья' },
  { code: 'abs', name: 'Пресс' },
  { code: 'lower-back', name: 'Разгибатели спины' },
  { code: 'glutes', name: 'Ягодичные' },
  { code: 'quads', name: 'Квадрицепс' },
  { code: 'hamstrings', name: 'Бицепс бедра' },
  { code: 'adductors', name: 'Приводящие' },
  { code: 'calves', name: 'Икры' },
]

const EXERCISES: { name: string; muscles: string[]; equipment: Equipment }[] = [
  { name: 'Жим штанги лёжа', muscles: ['chest', 'triceps'], equipment: 'BARBELL' },
  { name: 'Отжимания', muscles: ['chest', 'triceps'], equipment: 'BODYWEIGHT' },
  { name: 'Подтягивания', muscles: ['lats', 'biceps'], equipment: 'BODYWEIGHT' },
  { name: 'Тяга верхнего блока', muscles: ['lats'], equipment: 'MACHINE' },
  { name: 'Шраги с гантелями', muscles: ['traps'], equipment: 'DUMBBELL' },
  { name: 'Махи гантелями в стороны', muscles: ['mid-delts'], equipment: 'DUMBBELL' },
  { name: 'Разведения в наклоне', muscles: ['rear-delts'], equipment: 'DUMBBELL' },
  { name: 'Подъём штанги на бицепс', muscles: ['biceps'], equipment: 'BARBELL' },
  { name: 'Французский жим', muscles: ['triceps'], equipment: 'BARBELL' },
  { name: 'Приседания со штангой', muscles: ['quads', 'glutes'], equipment: 'BARBELL' },
  { name: 'Румынская тяга', muscles: ['hamstrings', 'glutes'], equipment: 'BARBELL' },
  { name: 'Сведение ног в тренажёре', muscles: ['adductors'], equipment: 'MACHINE' },
  { name: 'Подъём на носки', muscles: ['calves'], equipment: 'BODYWEIGHT' },
  { name: 'Скручивания', muscles: ['abs'], equipment: 'BODYWEIGHT' },
  { name: 'Гиперэкстензия', muscles: ['lower-back'], equipment: 'BODYWEIGHT' },
]

const NAME = Object.fromEntries(MUSCLES.map(m => [m.code, m.name]))

const TABS = [
  { value: 'exercises' as const, label: 'Упражнения' },
  { value: 'stretches' as const, label: 'Растяжки' },
]

// Новый верх справочника: две вкладки, «Мои» — кнопкой в шапке, поиск и строка чипов со шторками
export const LibraryFiltersDemo = () => {
  const [tab, setTab] = useState<'exercises' | 'stretches'>('exercises')
  const [query, setQuery] = useState('')
  const [codes, setCodes] = useState<string[]>([])
  const [equipment, setEquipment] = useState<Equipment | 'ALL'>('ALL')

  const match = (byCodes: string[]) =>
    EXERCISES.filter(
      e =>
        (byCodes.length === 0 || e.muscles.some(m => byCodes.includes(m))) &&
        (equipment === 'ALL' || e.equipment === equipment) &&
        e.name.toLowerCase().includes(query.trim().toLowerCase()),
    )
  const list = match(codes)

  return (
    <div className='border-foreground bg-background overflow-hidden border-2'>
      <header className='border-border px-gutter flex items-center justify-between gap-3 border-b-[1.5px] pt-4 pb-3'>
        <Eyebrow tone='primary'>Справочник</Eyebrow>
        <Button
          variant='outline'
          size='sm'
          className='relative -my-1.5'
        >
          Мои
          <CountBadge count={2} />
        </Button>
      </header>
      <div className='px-gutter flex flex-col gap-3 py-4'>
        <Segmented
          options={TABS}
          value={tab}
          onValueChange={setTab}
          size='default'
          stretch
        />
        <CatalogFilterBar
          query={query}
          onQueryChange={setQuery}
          muscles={MUSCLES}
          muscleCodes={codes}
          onMuscleCodesChange={setCodes}
          equipment={tab === 'exercises' ? equipment : undefined}
          onEquipmentChange={setEquipment}
          onReset={() => {
            setCodes([])
            setEquipment('ALL')
          }}
          showLabel={draft => `Показать ${match(draft).length}`}
        />
        <List>
          {list.map(e => (
            <ListRow
              key={e.name}
              title={e.name}
              meta={`${e.muscles.map(m => NAME[m]).join(', ')} · ${EQUIPMENT_LABEL[e.equipment]}`}
            />
          ))}
        </List>
        {list.length === 0 && (
          <Text
            size='sm'
            tone='muted'
          >
            Ничего не нашлось.
          </Text>
        )}
      </div>
    </div>
  )
}

// Та же карта в карточке упражнения: основные мышцы залиты, помогающие — наполовину
export const BodyMapCardDemo = () => (
  <div className='grid grid-cols-2 gap-4'>
    {(['front', 'back'] as const).map(side => (
      <div
        key={side}
        className='flex flex-col items-center gap-1'
      >
        <BodyMap
          side={side}
          selected={['chest']}
          secondary={['triceps', 'front-delts']}
          className='max-w-[150px]'
        />
        <Text
          size='xs'
          tone='muted'
        >
          {side === 'front' ? 'спереди' : 'сзади'}
        </Text>
      </div>
    ))}
  </div>
)

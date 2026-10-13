import { type Equipment, EQUIPMENT_LABEL, MUSCLE_GROUPS } from '@/entities/catalog/types'
import { SearchField } from '@/shared/ui/kit/SearchField'
import { Segmented } from '@/shared/ui/kit/Segmented'

const GROUPS = ['Все', ...MUSCLE_GROUPS.map(g => g.label)]

const EQUIPMENT = [
  { value: 'ALL' as const, label: 'Любой' },
  ...(Object.keys(EQUIPMENT_LABEL) as Equipment[]).map(value => ({ value, label: EQUIPMENT_LABEL[value] })),
]

type CatalogFiltersProps = {
  query: string
  onQueryChange: (query: string) => void
  group: string
  onGroupChange: (group: string) => void
  /** Фильтр инвентаря есть только у упражнений — у растяжек его не передаём */
  equipment?: Equipment | 'ALL'
  onEquipmentChange?: (equipment: Equipment | 'ALL') => void
  placeholder?: string
}

// Поиск по названию и фильтры справочника: группа мышц и инвентарь (frontend-tz, 11.1)
export const CatalogFilters = ({
  query,
  onQueryChange,
  group,
  onGroupChange,
  equipment,
  onEquipmentChange,
  placeholder = 'Название упражнения',
}: CatalogFiltersProps) => (
  <div className='flex flex-col gap-3'>
    <SearchField
      value={query}
      onValueChange={onQueryChange}
      placeholder={placeholder}
    />
    {/* Ленты фильтров прокручиваются вбок: на 320px шесть групп в строку не влезают */}
    <div className='no-scrollbar -mx-5 overflow-x-auto px-5 pb-1'>
      <Segmented
        options={GROUPS}
        value={group}
        onValueChange={onGroupChange}
      />
    </div>
    {equipment && onEquipmentChange && (
      <div className='no-scrollbar -mx-5 overflow-x-auto px-5 pb-1'>
        <Segmented
          options={EQUIPMENT}
          value={equipment}
          onValueChange={onEquipmentChange}
        />
      </div>
    )}
  </div>
)

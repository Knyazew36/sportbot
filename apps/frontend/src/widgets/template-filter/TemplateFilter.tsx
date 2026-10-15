import type { ProgramTagGroup, TagSelection } from '@/entities/program'
import { CHIP_ALL, ChipFilter } from '@/shared/ui/kit/ChipFilter'
import { SearchField } from '@/shared/ui/kit/SearchField'
import { Eyebrow } from '@/shared/ui/kit/Typography'

type TemplateFilterProps = {
  groups: ProgramTagGroup[]
  selection: TagSelection
  onSelectionChange: (selection: TagSelection) => void
  search: string
  onSearchChange: (search: string) => void
}

// Подбор шаблона под себя: поиск и ряд чипов на каждую группу тегов. Внутри группы — один чип,
// между группами — все сразу. Общий для каталога и шага программы онбординга
export const TemplateFilter = ({
  groups,
  selection,
  onSelectionChange,
  search,
  onSearchChange,
}: TemplateFilterProps) => {
  const pick = (groupCode: string, tagCode: string) => {
    const { [groupCode]: _, ...rest } = selection
    onSelectionChange(tagCode === CHIP_ALL ? rest : { ...rest, [groupCode]: tagCode })
  }

  return (
    <div className='flex flex-col gap-3'>
      <SearchField
        value={search}
        onValueChange={onSearchChange}
        placeholder='Название или для кого'
      />
      {groups.map(g => (
        <div
          key={g.id}
          className='flex flex-col gap-1.5'
        >
          <Eyebrow as='p'>{g.name}</Eyebrow>
          <ChipFilter
            options={g.tags.map(t => ({ value: t.code, label: t.name }))}
            value={selection[g.code] ?? CHIP_ALL}
            onValueChange={next => pick(g.code, next)}
          />
        </div>
      ))}
    </div>
  )
}

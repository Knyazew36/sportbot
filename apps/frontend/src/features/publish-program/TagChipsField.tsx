import { useState } from 'react'

import { normalizeTagName, type ProgramTagGroup } from '@sportbot/api/entities/program'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/shared/ui/shadcn/combobox'

/** Вариант в списке: тег справочника, свой тег автора или новый, ещё без id. create — пункт «Создать» */
type TagOption = { key: string; id: number | null; name: string; pending: boolean; create?: boolean }

type TagChipsFieldProps = {
  group: ProgramTagGroup
  /** Выбранные теги группы: справочник и свои уже стоящие */
  tagIds: number[]
  /** Новые свои теги группы, добавленные в этой форме */
  newNames: string[]
  /** Сколько своих тегов ещё можно добавить на программу */
  ownLeft: number
  invalid?: boolean
  onChange: (next: { tagIds: number[]; newNames: string[] }) => void
}

const NAME_MIN = 2
const NAME_MAX = 24

const cleanName = (name: string) => name.trim().replace(/\s+/g, ' ')

// Теги группы одним полем: выбор чипами из справочника и свой тег по Enter или запятой. Пробел не разделяет —
// теги бывают из нескольких слов («Верх тела»). Совпавший с существующим тег не создаётся: «зал» выберет «Зал»
export const TagChipsField = ({ group, tagIds, newNames, ownLeft, invalid, onChange }: TagChipsFieldProps) => {
  const anchor = useComboboxAnchor()
  // Текст поиска в поле, а не значение формы: в форму попадают только выбранные чипы
  const [query, setQuery] = useState('')

  const known: TagOption[] = group.tags.map(t => ({ key: `t${t.id}`, id: t.id, name: t.name, pending: !t.isApproved }))
  const added: TagOption[] = newNames.map(name => ({ key: `n:${name}`, id: null, name, pending: true }))
  const all = [...known, ...added]
  const value = [...known.filter(o => tagIds.includes(o.id!)), ...added]

  const typed = cleanName(query)
  const same = typed ? all.find(o => normalizeTagName(o.name) === normalizeTagName(typed)) : undefined
  const creatable = !same && typed.length >= NAME_MIN && typed.length <= NAME_MAX && ownLeft > 0
  const create: TagOption = { key: 'create', id: null, name: typed, pending: true, create: true }
  const items = creatable ? [...all, create] : all

  const commit = (next: TagOption[]) => {
    onChange({
      tagIds: next.filter(o => o.id != null).map(o => o.id!),
      newNames: next.filter(o => o.id == null).map(o => o.name),
    })
    setQuery('')
  }

  // Запятая — как Enter: выбрать совпавший тег или создать свой
  const commitTyped = () => {
    if (same) commit(value.some(o => o.key === same.key) ? value : [...value, same])
    else if (creatable) commit([...value, { ...create, key: `n:${typed}`, create: false }])
  }

  const emptyText =
    typed.length > NAME_MAX
      ? `Тег — до ${NAME_MAX} символов`
      : ownLeft <= 0 && !same
        ? 'Своих тегов уже максимум'
        : typed.length < NAME_MIN
          ? 'Начни вводить название'
          : 'Ничего не нашлось'

  return (
    <Combobox
      multiple
      autoHighlight
      items={items}
      value={value}
      onValueChange={next => commit(next.map(o => (o.create ? { ...o, key: `n:${o.name}`, create: false } : o)))}
      inputValue={query}
      onInputValueChange={setQuery}
      itemToStringLabel={o => o.name}
      isItemEqualToValue={(a, b) => a.key === b.key}
    >
      <ComboboxChips
        ref={anchor}
        aria-invalid={invalid}
      >
        <ComboboxValue>
          {value.map(o => (
            <ComboboxChip
              key={o.key}
              // Пунктир — свой тег: попадёт в справочник после проверки
              className={o.pending ? 'border-dashed' : undefined}
            >
              {o.name}
            </ComboboxChip>
          ))}
        </ComboboxValue>
        <ComboboxChipsInput
          placeholder={value.length ? '' : 'Выбери или впиши свой'}
          aria-invalid={invalid}
          onKeyDown={e => {
            if (e.key !== ',') return
            e.preventDefault()
            commitTyped()
          }}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(o: TagOption) => (
            <ComboboxItem
              key={o.key}
              value={o}
            >
              {o.create ? `Создать «${o.name}» — на проверку` : o.pending ? `${o.name} · на проверке` : o.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

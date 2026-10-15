import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { useState } from 'react'

import {
  type AdminProgramTag,
  programTagSchema,
  type ProgramTagValues,
  useCreateProgramTag,
  useDeleteProgramTag,
  useProgramTags,
  useReorderProgramTags,
  useUpdateProgramTag,
} from '@/entities/admin'
import { applyFieldErrors } from '@/shared/lib/form'
import { pluralize } from '@/shared/lib/format'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { TextField } from '@/shared/ui/kit/TextField'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

// Создание и правка одной формой: у правки есть tag, у создания нет
const TagForm = ({ tag, onDone }: { tag?: AdminProgramTag; onDone: () => void }) => {
  const create = useCreateProgramTag()
  const update = useUpdateProgramTag()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProgramTagValues>({
    resolver: zodResolver(programTagSchema),
    defaultValues: { code: tag?.code ?? '', name: tag?.name ?? '' },
  })
  const pending = create.isPending || update.isPending

  return (
    <form
      className='px-gutter flex flex-col gap-3 pb-6'
      onSubmit={handleSubmit(values =>
        (tag ? update.mutateAsync({ id: tag.id, ...values }) : create.mutateAsync(values))
          .then(onDone)
          .catch(error => applyFieldErrors(error, setError)),
      )}
    >
      <TextField
        label='Название чипа'
        placeholder='Например, «Дом»'
        error={errors.name}
        {...register('name')}
      />
      <TextField
        label='Код для импорта'
        placeholder='home'
        autoCapitalize='none'
        error={errors.code}
        {...register('code')}
      />
      <Button
        type='submit'
        size='lg'
        className='w-full'
        disabled={pending}
      >
        {tag ? 'Сохранить' : 'Добавить'}
      </Button>
    </form>
  )
}

// Теги шаблонов: чипы-фильтры на шаге программы онбординга и в «Шаблонах». Порядок здесь — порядок чипов
export const ProgramTagsBlock = () => {
  const tags = useProgramTags()
  const reorder = useReorderProgramTags()
  const remove = useDeleteProgramTag()
  // null — шторка закрыта, 'new' — новый тег, иначе правка этого тега
  const [editing, setEditing] = useState<AdminProgramTag | 'new' | null>(null)

  const move = (list: AdminProgramTag[], index: number, shift: -1 | 1) => {
    const ids = list.map(t => t.id)
    const [moved] = ids.splice(index, 1)
    if (moved === undefined) return
    ids.splice(index + shift, 0, moved)
    reorder.mutate(ids)
  }

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between gap-3'>
        <Eyebrow>тегов: {tags.data?.length ?? '—'}</Eyebrow>
        <Button
          size='sm'
          variant='outline'
          onClick={() => setEditing('new')}
        >
          <PlusIcon strokeWidth={2.5} />
          Тег
        </Button>
      </div>
      <QueryScreen
        query={tags}
        className=''
        isEmpty={list => list.length === 0}
        empty={{ title: 'Тегов нет', description: 'Добавь «Дом» или «Зал» — пользователи смогут фильтровать шаблоны.' }}
      >
        {list => (
          <List>
            {list.map((t, i) => (
              <ListRow
                key={t.id}
                lead={String(i + 1).padStart(2, '0')}
                title={t.name}
                meta={`${t.code} · ${pluralize(t.templateCount, ['шаблон', 'шаблона', 'шаблонов'])}`}
                trail={
                  <div className='flex gap-1'>
                    <Button
                      size='icon-sm'
                      variant='outline'
                      aria-label={`Выше: ${t.name}`}
                      disabled={i === 0 || reorder.isPending}
                      onClick={() => move(list, i, -1)}
                    >
                      <ArrowUpIcon />
                    </Button>
                    <Button
                      size='icon-sm'
                      variant='outline'
                      aria-label={`Ниже: ${t.name}`}
                      disabled={i === list.length - 1 || reorder.isPending}
                      onClick={() => move(list, i, 1)}
                    >
                      <ArrowDownIcon />
                    </Button>
                    <Button
                      size='icon-sm'
                      variant='outline'
                      aria-label={`Изменить: ${t.name}`}
                      onClick={() => setEditing(t)}
                    >
                      <PencilIcon />
                    </Button>
                    <ConfirmAction
                      trigger={
                        <Button
                          size='icon-sm'
                          variant='outline'
                          aria-label={`Удалить: ${t.name}`}
                        />
                      }
                      title={`Удалить тег «${t.name}»?`}
                      description='Он пропадёт с шаблонов и из чипов. Сами шаблоны останутся.'
                      confirmLabel='Удалить'
                      onConfirm={() => remove.mutateAsync(t.id)}
                    >
                      <Trash2Icon />
                    </ConfirmAction>
                  </div>
                }
              />
            ))}
          </List>
        )}
      </QueryScreen>

      <Sheet
        open={editing !== null}
        onOpenChange={open => !open && setEditing(null)}
      >
        <SheetContent side='bottom'>
          <SheetHeader>
            <SheetTitle>{editing === 'new' ? 'Новый тег' : 'Тег'}</SheetTitle>
            <SheetDescription>Код нужен для импорта файлом, название видят пользователи на чипе.</SheetDescription>
          </SheetHeader>
          {editing !== null && (
            <TagForm
              key={editing === 'new' ? 'new' : editing.id}
              tag={editing === 'new' ? undefined : editing}
              onDone={() => setEditing(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

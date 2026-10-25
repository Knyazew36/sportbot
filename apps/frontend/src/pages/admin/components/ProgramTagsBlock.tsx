import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

import { useState } from 'react'

import {
  type AdminProgramTag,
  type AdminProgramTagGroup,
  programTagGroupSchema,
  type ProgramTagGroupValues,
  programTagSchema,
  type ProgramTagValues,
  useCreateProgramTag,
  useCreateProgramTagGroup,
  useDeleteProgramTag,
  useDeleteProgramTagGroup,
  useProgramTagGroups,
  useReorderProgramTagGroups,
  useReorderProgramTags,
  useUpdateProgramTag,
  useUpdateProgramTagGroup,
} from '@sportbot/api/entities/admin'
import { applyFieldErrors } from '@/shared/lib/form'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { SelectField } from '@/shared/ui/kit/SelectField'
import { TextField } from '@/shared/ui/kit/TextField'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Label } from '@/shared/ui/shadcn/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

/** Список id с элементом, сдвинутым на shift */
const moved = (ids: number[], index: number, shift: -1 | 1): number[] => {
  const next = [...ids]
  const [item] = next.splice(index, 1)
  if (item !== undefined) next.splice(index + shift, 0, item)
  return next
}

// Стрелки порядка: выше и ниже
const OrderButtons = ({
  label,
  index,
  count,
  pending,
  onMove,
}: {
  label: string
  index: number
  count: number
  pending: boolean
  onMove: (shift: -1 | 1) => void
}) => (
  <>
    <Button
      size='icon-sm'
      variant='outline'
      aria-label={`Выше: ${label}`}
      disabled={index === 0 || pending}
      onClick={() => onMove(-1)}
    >
      <ArrowUpIcon />
    </Button>
    <Button
      size='icon-sm'
      variant='outline'
      aria-label={`Ниже: ${label}`}
      disabled={index === count - 1 || pending}
      onClick={() => onMove(1)}
    >
      <ArrowDownIcon />
    </Button>
  </>
)

// Создание и правка тега одной формой: у правки есть tag, у создания нет
const TagForm = ({
  tag,
  groups,
  onDone,
}: {
  tag?: AdminProgramTag
  groups: AdminProgramTagGroup[]
  onDone: () => void
}) => {
  const create = useCreateProgramTag()
  const update = useUpdateProgramTag()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProgramTagValues>({
    resolver: zodResolver(programTagSchema),
    defaultValues: { code: tag?.code ?? '', name: tag?.name ?? '', groupId: tag?.groupId ?? groups[0]?.id },
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
      <div className='flex flex-col gap-2'>
        <Label>Группа</Label>
        <Controller
          control={control}
          name='groupId'
          render={({ field }) => (
            <SelectField
              ariaLabel='Группа'
              options={groups.map(g => ({ value: String(g.id), label: g.name }))}
              value={field.value == null ? '' : String(field.value)}
              onValueChange={v => field.onChange(Number(v))}
            />
          )}
        />
        <ErrorText errors={errors.groupId} />
      </div>
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

// Создание и правка группы одной формой
const GroupForm = ({ group, onDone }: { group?: AdminProgramTagGroup; onDone: () => void }) => {
  const create = useCreateProgramTagGroup()
  const update = useUpdateProgramTagGroup()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProgramTagGroupValues>({
    resolver: zodResolver(programTagGroupSchema),
    defaultValues: { code: group?.code ?? '', name: group?.name ?? '' },
  })
  const pending = create.isPending || update.isPending

  return (
    <form
      className='px-gutter flex flex-col gap-3 pb-6'
      onSubmit={handleSubmit(values =>
        (group ? update.mutateAsync({ id: group.id, ...values }) : create.mutateAsync(values))
          .then(onDone)
          .catch(error => applyFieldErrors(error, setError)),
      )}
    >
      <TextField
        label='Название группы'
        placeholder='Например, «Где занимаешься»'
        error={errors.name}
        {...register('name')}
      />
      <TextField
        label='Код для ссылки и импорта'
        placeholder='place'
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
        {group ? 'Сохранить' : 'Добавить'}
      </Button>
    </form>
  )
}

type Editing = { kind: 'tag'; tag?: AdminProgramTag } | { kind: 'group'; group?: AdminProgramTagGroup } | null

// Теги шаблонов по группам: каждая группа — ряд чипов в каталоге и на шаге программы онбординга.
// Порядок групп здесь — порядок рядов, порядок тегов в группе — порядок чипов
export const ProgramTagsBlock = () => {
  const groups = useProgramTagGroups()
  const reorderGroups = useReorderProgramTagGroups()
  const reorderTags = useReorderProgramTags()
  const removeGroup = useDeleteProgramTagGroup()
  const removeTag = useDeleteProgramTag()
  const [editing, setEditing] = useState<Editing>(null)

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between gap-3'>
        <Eyebrow>групп: {groups.data?.length ?? '—'}</Eyebrow>
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={() => setEditing({ kind: 'group' })}
          >
            <PlusIcon strokeWidth={2.5} />
            Группа
          </Button>
          <Button
            size='sm'
            variant='outline'
            disabled={!groups.data?.length}
            onClick={() => setEditing({ kind: 'tag' })}
          >
            <PlusIcon strokeWidth={2.5} />
            Тег
          </Button>
        </div>
      </div>
      <QueryScreen
        query={groups}
        className=''
        isEmpty={list => list.length === 0}
        empty={{
          title: 'Групп нет',
          description: 'Добавь «Где занимаешься» с тегами «Дом» и «Зал» — пользователи смогут подбирать шаблоны.',
        }}
      >
        {list =>
          list.map((g, gi) => (
            <section
              key={g.id}
              className='border-foreground/20 flex flex-col gap-1 border-t pt-3'
            >
              <div className='flex items-center justify-between gap-2'>
                <div className='min-w-0'>
                  <Eyebrow
                    as='h3'
                    tone='primary'
                  >
                    {g.name}
                  </Eyebrow>
                  <Eyebrow
                    as='p'
                    size='sm'
                  >
                    {g.code} · {pluralize(g.tags.length, ['тег', 'тега', 'тегов'])}
                  </Eyebrow>
                </div>
                <div className='flex shrink-0 gap-1'>
                  <OrderButtons
                    label={g.name}
                    index={gi}
                    count={list.length}
                    pending={reorderGroups.isPending}
                    onMove={shift =>
                      reorderGroups.mutate(
                        moved(
                          list.map(x => x.id),
                          gi,
                          shift,
                        ),
                      )
                    }
                  />
                  <Button
                    size='icon-sm'
                    variant='outline'
                    aria-label={`Изменить группу: ${g.name}`}
                    onClick={() => setEditing({ kind: 'group', group: g })}
                  >
                    <PencilIcon />
                  </Button>
                  <ConfirmAction
                    trigger={
                      <Button
                        size='icon-sm'
                        variant='outline'
                        aria-label={`Удалить группу: ${g.name}`}
                      />
                    }
                    title={`Удалить группу «${g.name}»?`}
                    description='Удалить можно только пустую группу: сначала перенеси или удали её теги.'
                    confirmLabel='Удалить'
                    onConfirm={() => removeGroup.mutateAsync(g.id)}
                  >
                    <Trash2Icon />
                  </ConfirmAction>
                </div>
              </div>
              {g.tags.length > 0 && (
                <List>
                  {g.tags.map((t, i) => (
                    <ListRow
                      key={t.id}
                      lead={String(i + 1).padStart(2, '0')}
                      title={t.name}
                      meta={`${t.code} · ${pluralize(t.templateCount, ['шаблон', 'шаблона', 'шаблонов'])}`}
                      trail={
                        <div className='flex gap-1'>
                          <OrderButtons
                            label={t.name}
                            index={i}
                            count={g.tags.length}
                            pending={reorderTags.isPending}
                            onMove={shift =>
                              reorderTags.mutate(
                                moved(
                                  g.tags.map(x => x.id),
                                  i,
                                  shift,
                                ),
                              )
                            }
                          />
                          <Button
                            size='icon-sm'
                            variant='outline'
                            aria-label={`Изменить: ${t.name}`}
                            onClick={() => setEditing({ kind: 'tag', tag: t })}
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
                            onConfirm={() => removeTag.mutateAsync(t.id)}
                          >
                            <Trash2Icon />
                          </ConfirmAction>
                        </div>
                      }
                    />
                  ))}
                </List>
              )}
            </section>
          ))
        }
      </QueryScreen>

      <Sheet
        open={editing !== null}
        onOpenChange={open => !open && setEditing(null)}
      >
        <SheetContent>
          {editing?.kind === 'tag' && (
            <>
              <SheetHeader>
                <SheetTitle>{editing.tag ? 'Тег' : 'Новый тег'}</SheetTitle>
                <SheetDescription>Название видят пользователи на чипе, код нужен для импорта файлом.</SheetDescription>
              </SheetHeader>
              <TagForm
                key={editing.tag?.id ?? 'new'}
                tag={editing.tag}
                groups={groups.data ?? []}
                onDone={() => setEditing(null)}
              />
            </>
          )}
          {editing?.kind === 'group' && (
            <>
              <SheetHeader>
                <SheetTitle>{editing.group ? 'Группа тегов' : 'Новая группа'}</SheetTitle>
                <SheetDescription>
                  Группа — ряд чипов в каталоге: «Где», «Уровень», «Цель». Код попадает в ссылку фильтра.
                </SheetDescription>
              </SheetHeader>
              <GroupForm
                key={editing.group?.id ?? 'new'}
                group={editing.group}
                onDone={() => setEditing(null)}
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

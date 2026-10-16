import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, XIcon } from 'lucide-react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'

import {
  normalizeTagName,
  OWN_TAGS_MAX,
  ownTagNameSchema,
  type OwnTagNameValues,
  type Program,
  type ProgramTag,
  type ProgramTagGroup,
  publishProgramSchema,
  type PublishProgramValues,
  useAllTagGroups,
  usePublishProgram,
} from '@/entities/program'
import { applyFieldErrors } from '@/shared/lib/form'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { QueryState } from '@/shared/ui/kit/QueryState'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'

type PublishSheetProps = {
  program: Program
  open: boolean
  onOpenChange: (open: boolean) => void
}

type OwnTagInputProps = {
  /** Теги группы, с которыми сверяем ввод: справочник и свои уже стоящие */
  known: ProgramTag[]
  /** Свои теги, добавленные в этой форме */
  added: string[]
  disabled: boolean
  onAdd: (name: string) => void
  onPickExisting: (tagId: number) => void
}

// «+ свой» в конце ряда: совпал с тегом группы — предлагаем его, чтобы не плодить «Зал» и «зал»
const OwnTagInput = ({ known, added, disabled, onAdd, onPickExisting }: OwnTagInputProps) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<OwnTagNameValues>({ resolver: zodResolver(ownTagNameSchema), defaultValues: { name: '' } })
  const typed = normalizeTagName(useWatch({ control, name: 'name' }))
  const same = typed ? known.find(t => normalizeTagName(t.name) === typed) : undefined
  const repeated = !!typed && added.some(name => normalizeTagName(name) === typed)

  // Отдельной <form> нет: она вложилась бы в форму публикации
  const add = handleSubmit(({ name }) => {
    onAdd(name)
    reset()
  })

  return (
    <div className='flex flex-col gap-1.5'>
      <div className='flex gap-2'>
        <Input
          placeholder='Свой тег'
          maxLength={24}
          disabled={disabled}
          aria-invalid={!!errors.name}
          onKeyDown={e => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            void add()
          }}
          {...register('name')}
        />
        <Button
          type='button'
          variant='outline'
          size='icon'
          className='size-12'
          aria-label='Добавить свой тег'
          disabled={disabled || !!same || repeated}
          onClick={() => void add()}
        >
          <PlusIcon />
        </Button>
      </div>
      {same ? (
        <Text
          size='sm'
          tone='muted'
        >
          Такой тег уже есть —{' '}
          <button
            type='button'
            className='text-primary underline underline-offset-2'
            onClick={() => {
              onPickExisting(same.id)
              reset()
            }}
          >
            выбрать «{same.name}»
          </button>
        </Text>
      ) : repeated ? (
        <Text
          size='sm'
          tone='muted'
        >
          Этот тег уже добавлен
        </Text>
      ) : (
        <ErrorText errors={errors.name} />
      )}
    </div>
  )
}

type PublishFormProps = {
  program: Program
  groups: ProgramTagGroup[]
  onDone: () => void
}

const PublishForm = ({ program, groups, onDone }: PublishFormProps) => {
  const publish = usePublishProgram()
  // Свои теги автора, ещё не одобренные, встают в ряд своей группы рядом с тегами справочника
  const pending = program.tags.filter(t => !t.isApproved)
  const rows = groups.map(g => ({ ...g, tags: [...g.tags, ...pending.filter(t => t.groupId === g.id)] }))
  const schema = publishProgramSchema(rows.map(g => ({ id: g.id, name: g.name, tagIds: g.tags.map(t => t.id) })))

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<PublishProgramValues>({
    resolver: zodResolver(schema),
    defaultValues: { description: program.description ?? '', tagIds: program.tags.map(t => t.id), newTags: [] },
  })
  const newTags = useFieldArray({ control, name: 'newTags' })
  const pendingIds = new Set(pending.map(t => t.id))
  const tagIds = useWatch({ control, name: 'tagIds' })
  const ownCount = tagIds.filter(id => pendingIds.has(id)).length + newTags.fields.length
  const pick = (tagId: number) => {
    const current = getValues('tagIds')
    if (!current.includes(tagId)) setValue('tagIds', [...current, tagId], { shouldValidate: true })
  }

  return (
    <form
      className='px-gutter flex flex-col gap-5 pb-6'
      onSubmit={handleSubmit(values =>
        publish
          .mutateAsync({ id: program.id, ...values })
          .then(onDone)
          .catch(error => applyFieldErrors(error, setError)),
      )}
    >
      <div className='flex flex-col gap-2'>
        <Label htmlFor='publish-description'>Описание</Label>
        <Textarea
          id='publish-description'
          placeholder='Для кого программа, сколько раз в неделю и что нужно из инвентаря'
          maxLength={1000}
          aria-invalid={!!errors.description}
          {...register('description')}
        />
        <ErrorText errors={errors.description} />
      </div>

      {rows.map(g => {
        const own = new Set(g.tags.map(t => t.id))
        const added = newTags.fields.map((t, index) => ({ ...t, index })).filter(t => t.groupId === g.id)
        return (
          <div
            key={g.id}
            className='flex flex-col gap-2'
          >
            <Label>{g.name}</Label>
            <Controller
              control={control}
              name='tagIds'
              render={({ field }) => (
                // Каждая группа правит только свои теги, теги других групп остаются как были
                <ToggleGroup
                  multiple
                  value={field.value.filter(id => own.has(id)).map(String)}
                  onValueChange={v => field.onChange([...field.value.filter(id => !own.has(id)), ...v.map(Number)])}
                  className='grid w-full grid-cols-2 gap-2'
                >
                  {g.tags.map(t => (
                    <ToggleGroupItem
                      key={t.id}
                      value={String(t.id)}
                      className='h-auto min-h-11 flex-col items-start justify-center px-3 py-1.5'
                    >
                      {t.name}
                      {!t.isApproved && <Eyebrow size='sm'>на проверке</Eyebrow>}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
            />
            {added.map(t => (
              <div
                key={t.id}
                className='border-foreground/80 flex h-11 items-center justify-between gap-2 border-[1.5px] px-3'
              >
                <span className='truncate'>
                  {t.name} <Eyebrow size='sm'>новый, на проверку</Eyebrow>
                </span>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  aria-label={`Убрать тег «${t.name}»`}
                  onClick={() => newTags.remove(t.index)}
                >
                  <XIcon />
                </Button>
              </div>
            ))}
            <OwnTagInput
              known={g.tags}
              added={added.map(t => t.name)}
              disabled={ownCount >= OWN_TAGS_MAX}
              onAdd={name => newTags.append({ groupId: g.id, name })}
              onPickExisting={pick}
            />
          </div>
        )
      })}
      <ErrorText errors={[errors.tagIds, errors.newTags]} />
      <Text
        size='sm'
        tone='muted'
      >
        Своих тегов — до {OWN_TAGS_MAX}. Их проверит администратор: может заменить на похожий из списка.
      </Text>

      <Button
        type='submit'
        className='w-full'
        disabled={publish.isPending}
      >
        {program.publication === 'PUBLISHED' ? 'Сохранить' : 'Отправить на проверку'}
      </Button>
    </form>
  )
}

// Форма публикации поверх обычной программы: создание остаётся коротким, описание и теги нужны только каталогу
export const PublishSheet = ({ program, open, onOpenChange }: PublishSheetProps) => {
  const groups = useAllTagGroups()
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent className='max-h-[92dvh] overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>{program.publication === 'PUBLISHED' ? 'Публикация' : 'Опубликовать в каталог'}</SheetTitle>
          <SheetDescription>
            {program.publication === 'PUBLISHED'
              ? 'Теги меняются сразу. Новое название или описание появится в каталоге после проверки.'
              : 'Программу увидят все в «Программах пользователей» и смогут взять себе. Сначала её проверит администратор.'}
          </SheetDescription>
        </SheetHeader>
        {open && (
          <QueryState query={groups}>
            {list => (
              <PublishForm
                program={program}
                groups={list}
                onDone={() => onOpenChange(false)}
              />
            )}
          </QueryState>
        )}
      </SheetContent>
    </Sheet>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'

import {
  OWN_TAGS_MAX,
  type Program,
  type ProgramTagGroup,
  publishProgramSchema,
  type PublishProgramValues,
  useAllTagGroups,
  usePublishProgram,
} from '@/entities/program'
import { applyFieldErrors } from '@/shared/lib/form'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { QueryState } from '@/shared/ui/kit/QueryState'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Label } from '@/shared/ui/shadcn/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { Textarea } from '@/shared/ui/shadcn/textarea'

import { TagChipsField } from './TagChipsField'

type PublishSheetProps = {
  program: Program
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PublishFormProps = {
  program: Program
  groups: ProgramTagGroup[]
  onDone: () => void
}

const PublishForm = ({ program, groups, onDone }: PublishFormProps) => {
  const publish = usePublishProgram()
  // Свои теги автора, ещё не одобренные, встают в поле своей группы рядом с тегами справочника
  const pending = program.tags.filter(t => !t.isApproved)
  const rows = groups.map(g => ({ ...g, tags: [...g.tags, ...pending.filter(t => t.groupId === g.id)] }))
  const schema = publishProgramSchema(rows.map(g => ({ id: g.id, name: g.name, tagIds: g.tags.map(t => t.id) })))

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<PublishProgramValues>({
    resolver: zodResolver(schema),
    defaultValues: { description: program.description ?? '', tagIds: program.tags.map(t => t.id), newTags: [] },
  })
  const [tagIds, newTags] = useWatch({ control, name: ['tagIds', 'newTags'] })
  const pendingIds = new Set(pending.map(t => t.id))
  const ownLeft = OWN_TAGS_MAX - tagIds.filter(id => pendingIds.has(id)).length - newTags.length

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
                // Каждая группа правит только свои теги и свои новые, остальные остаются как были
                <TagChipsField
                  group={g}
                  tagIds={field.value.filter(id => own.has(id))}
                  newNames={newTags.filter(t => t.groupId === g.id).map(t => t.name)}
                  ownLeft={ownLeft}
                  invalid={!!errors.tagIds}
                  onChange={next => {
                    field.onChange([...field.value.filter(id => !own.has(id)), ...next.tagIds])
                    setValue(
                      'newTags',
                      [
                        ...newTags.filter(t => t.groupId !== g.id),
                        ...next.newNames.map(name => ({ groupId: g.id, name })),
                      ],
                      { shouldValidate: isSubmitted },
                    )
                  }}
                />
              )}
            />
          </div>
        )
      })}
      <ErrorText errors={[errors.tagIds, errors.newTags]} />
      <Text
        size='sm'
        tone='muted'
      >
        Нет нужного тега — впиши свой и нажми Enter или запятую. Своих тегов — до {OWN_TAGS_MAX}, они с пунктиром: их
        проверит администратор и может заменить на похожий из списка.
      </Text>

      <Button
        type='submit'
        variant='share'
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

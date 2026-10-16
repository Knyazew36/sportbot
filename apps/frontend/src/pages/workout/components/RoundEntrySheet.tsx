import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, UndoIcon } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'

import {
  newClientId,
  type RoundEntryInput,
  roundEntrySchema,
  type RoundEntryValues,
  roundPrefill,
  type SupersetRound,
  supersetLabels,
  useAddSet,
} from '@/entities/workout'
import { cn } from '@/shared/lib/utils'
import { BoxInput } from '@/shared/ui/kit/BoxInput'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

type RoundEntryFormProps = {
  round: SupersetRound
  onSubmit: (values: RoundEntryValues) => void
}

const RoundEntryForm = ({ round, onSubmit }: RoundEntryFormProps) => {
  const labels = supersetLabels(round.members)
  const label = (itemId: number) => labels[round.members.findIndex(e => e.id === itemId)]
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RoundEntryInput, unknown, RoundEntryValues>({
    resolver: zodResolver(roundEntrySchema),
    // Поля заполнены заранее: обычно круг повторяет прошлый, и остаётся нажать одну кнопку
    defaultValues: {
      rows: round.round.map(e => ({ itemId: e.id, bodyweight: e.bodyweight, skip: false, ...roundPrefill(e) })),
    },
  })
  const { fields } = useFieldArray({ control, name: 'rows' })
  const rows = watch('rows')
  // Пустой вес — не догадка, а пропуск: кнопка ждёт, пока его впишут
  const blocked = rows.every(r => r.skip) || rows.some(r => !r.skip && !r.bodyweight && !r.weight.trim())

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      autoComplete='off'
      className='flex flex-col gap-3 px-gutter pb-6'
    >
      <ol className='border-border flex flex-col border-t-[1.5px]'>
        {fields.map((field, i) => {
          const item = round.round.find(e => e.id === field.itemId)!
          const row = rows[i]!
          const rowErrors = errors.rows?.[i]
          return (
            <li
              key={field.id}
              className='border-border border-b-[1.5px] py-3'
            >
              <div className='flex items-center gap-2'>
                <Poster
                  as='span'
                  size='xs'
                  tone='primary'
                >
                  {label(item.id)}
                </Poster>
                <Text
                  size='sm'
                  className={cn('min-w-0 flex-1 truncate', row.skip && 'text-muted-foreground line-through')}
                >
                  {item.name}
                </Text>
                <Button
                  type='button'
                  variant={row.skip ? 'default' : 'outline'}
                  size='xs'
                  onClick={() => setValue(`rows.${i}.skip`, !row.skip, { shouldValidate: false })}
                >
                  {row.skip ? <UndoIcon className='size-3.5' /> : null}
                  {row.skip ? 'делал' : 'не делал'}
                </Button>
              </div>
              {!row.skip && (
                <div className={cn('mt-2 grid gap-2', item.bodyweight ? 'grid-cols-1' : 'grid-cols-2')}>
                  {!item.bodyweight && (
                    <BoxInput
                      label='вес, кг'
                      placeholder='?'
                      // Вес пустой — рамка акцентом: без веса круг не записать
                      className={cn('py-1.5', !row.weight.trim() && 'border-primary')}
                      {...register(`rows.${i}.weight`)}
                    />
                  )}
                  <BoxInput
                    label='повторы'
                    inputMode='numeric'
                    placeholder={String(item.repsMin)}
                    className='py-1.5'
                    {...register(`rows.${i}.reps`)}
                  />
                </div>
              )}
              <ErrorText
                className='mt-1'
                errors={[rowErrors?.weight, rowErrors?.reps]}
              />
            </li>
          )
        })}
      </ol>
      <ErrorText errors={[errors.rows?.root ?? errors.rows]} />
      <Button
        type='submit'
        size='xl'
        className='w-full'
        disabled={blocked}
      >
        <CheckIcon
          className='size-7'
          strokeWidth={3}
        />
        Записать круг
      </Button>
    </form>
  )
}

type RoundEntrySheetProps = {
  open: boolean
  round: SupersetRound | null
  onClose: () => void
  /** Круг принят к отправке: id упражнений, по которым записан подход. Экран идёт дальше, не дожидаясь сервера */
  onSaved: (addedIds: number[]) => void
}

// Ввод круга суперсета после «Закончил круг»: строка на участника, одна кнопка.
// Подходы встают в офлайн-очередь по одному на упражнение — как обычные, со своим clientId
export const RoundEntrySheet = ({ open, round, onClose, onSaved }: RoundEntrySheetProps) => {
  const add = useAddSet()

  const submit = ({ rows }: RoundEntryValues) => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    const done = rows.filter(r => !r.skip)
    onSaved(done.map(r => r.itemId))
    for (const r of done) add.mutate({ itemId: r.itemId, weight: r.weight, reps: r.reps, clientId: newClientId() })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={next => !next && onClose()}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            Круг {round?.number} · суперсет {round?.letter}
          </SheetTitle>
          <SheetDescription>Проверь вес и повторы — подставлены с прошлого раза</SheetDescription>
        </SheetHeader>
        {open && round && (
          <RoundEntryForm
            key={`${round.superset}-${round.number}`}
            round={round}
            onSubmit={submit}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

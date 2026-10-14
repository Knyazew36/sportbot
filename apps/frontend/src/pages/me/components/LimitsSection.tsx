import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { useState } from 'react'

import { useJoints } from '@/entities/catalog'
import { useCreateLimitation, useDeleteLimitation, useLimitations } from '@/entities/limitation'
import { type LimitationInput, limitationSchema, type LimitationValues } from '@/entities/profile'
import { applyFieldErrors } from '@/shared/lib/form'
import { formatDate } from '@/shared/lib/format'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { SelectField } from '@/shared/ui/kit/SelectField'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Label } from '@/shared/ui/shadcn/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

import { TermFields } from './TermFields'

const LimitationForm = ({ onDone }: { onDone: () => void }) => {
  const joints = useJoints()
  const create = useCreateLimitation()
  const {
    control,
    handleSubmit,
    register,
    setValue,
    setError,
    formState: { errors },
  } = useForm<LimitationInput, unknown, LimitationValues>({
    resolver: zodResolver(limitationSchema),
    defaultValues: { jointId: 0, term: 'date', endDate: '' },
  })
  const term = useWatch({ control, name: 'term' })

  return (
    <form
      className='flex flex-col gap-4 px-gutter pb-6'
      onSubmit={handleSubmit(values =>
        create
          .mutateAsync(values)
          .then(onDone)
          .catch(error => applyFieldErrors(error, setError)),
      )}
    >
      <div className='flex flex-col gap-2'>
        <Label>Зона</Label>
        <Controller
          control={control}
          name='jointId'
          render={({ field }) => (
            <SelectField
              options={(joints.data ?? []).map(j => ({ value: String(j.id), label: j.name }))}
              value={field.value ? String(field.value) : ''}
              onValueChange={v => field.onChange(Number(v))}
              ariaLabel='Зона'
            />
          )}
        />
        <ErrorText errors={errors.jointId} />
      </div>
      <div className='flex flex-col gap-2'>
        <Label>Срок</Label>
        <TermFields
          term={term}
          onTermChange={v => setValue('term', v)}
          dateProps={register('endDate')}
          error={errors.endDate}
          dateLabel='До какой даты'
        />
      </div>
      <Button
        type='submit'
        size='lg'
        className='w-full'
        disabled={create.isPending}
      >
        Добавить
      </Button>
    </form>
  )
}

// Ограничения по суставам (frontend-tz, 13.4): ⚠️ в комплексе и фильтр аналогов при замене
export const LimitsSection = () => {
  const limitations = useLimitations()
  const remove = useDeleteLimitation()
  const [open, setOpen] = useState(false)

  return (
    <ScreenSection
      variant='block'
      index={4}
      title='Ограничения по суставам'
      aside='бот предупредит в тренировке'
    >
      {limitations.data?.length ? (
        <List>
          {limitations.data.map(l => (
            <ListRow
              key={l.id}
              title={l.jointName}
              meta={l.endDate ? `до ${formatDate(l.endDate, 'd MMMM')}` : 'до отмены'}
              trail={
                <Button
                  variant='outline'
                  size='xs'
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(l.id)}
                >
                  Снять
                </Button>
              }
            />
          ))}
        </List>
      ) : (
        <Text tone='muted'>Ограничений нет. Добавь, если что-то болит — бот подскажет замену.</Text>
      )}
      <Button
        variant='outline'
        size='sm'
        className='self-start'
        onClick={() => setOpen(true)}
      >
        <PlusIcon strokeWidth={2.5} />
        Добавить ограничение
      </Button>

      <Sheet
        open={open}
        onOpenChange={setOpen}
      >
        <SheetContent side='bottom'>
          <SheetHeader>
            <SheetTitle>Ограничение</SheetTitle>
            {/* Дисклеймер при включении ограничения (frontend-tz, 13.4) */}
            <SheetDescription>Это подсказка для подбора упражнений, она не заменяет врача.</SheetDescription>
          </SheetHeader>
          {open && <LimitationForm onDone={() => setOpen(false)} />}
        </SheetContent>
      </Sheet>
    </ScreenSection>
  )
}

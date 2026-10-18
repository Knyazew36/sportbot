import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRightIcon, CheckIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import {
  type BodyWeightInput,
  bodyWeightSchema,
  type BodyWeightValues,
  type Profile,
  useAddBodyWeight,
  useUpdateProfile,
} from '@/entities/profile'
import { ROUTES } from '@/shared/config/paths'
import { applyFieldErrors } from '@/shared/lib/form'
import { BoxInput } from '@/shared/ui/kit/BoxInput'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { SelectField } from '@/shared/ui/kit/SelectField'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Label } from '@/shared/ui/shadcn/label'

const WEIGHT_ASK = [
  { value: 'OFF', label: 'Не спрашивать' },
  { value: 'WEEKLY', label: 'Раз в неделю' },
  { value: 'BIWEEKLY', label: 'Раз в две недели' },
  { value: 'MONTHLY', label: 'Раз в месяц' },
]

type Frequency = Profile['weightAskFrequency']

// Вес тела (frontend-tz, 13.5): запись за сегодня, частота вопроса от бота; график — в статистике
export const BodyWeightSection = ({ profile }: { profile: Profile }) => {
  const add = useAddBodyWeight()
  const update = useUpdateProfile()
  const last = profile.lastBodyWeight?.toString().replace('.', ',')
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<BodyWeightInput, unknown, BodyWeightValues>({
    resolver: zodResolver(bodyWeightSchema),
    defaultValues: { value: '' },
  })

  return (
    <ScreenSection aside={last ? `последний ${last} кг` : undefined}>
      <form
        className='grid grid-cols-[1fr_auto] gap-2'
        onSubmit={handleSubmit(({ value }) =>
          add
            .mutateAsync(value)
            .then(() => reset(undefined, { keepFieldsRef: true }))
            .catch(error => applyFieldErrors(error, setError)),
        )}
      >
        <BoxInput
          label='сегодня, кг'
          inputMode='decimal'
          placeholder={last ?? '—'}
          aria-invalid={!!errors.value}
          {...register('value')}
        />
        <Button
          type='submit'
          className='h-auto px-4'
          disabled={add.isPending}
        >
          <CheckIcon
            className='size-5'
            strokeWidth={3}
          />
          Записать
        </Button>
      </form>
      <ErrorText errors={errors.value} />
      <ButtonLink
        to={ROUTES.STATS}
        variant='outline'
        size='sm'
        className='self-start'
      >
        График в статистике
        <ArrowRightIcon />
      </ButtonLink>
      <div className='flex flex-col gap-2'>
        <Label>Бот спрашивает вес</Label>
        <SelectField
          options={WEIGHT_ASK}
          value={profile.weightAskFrequency}
          onValueChange={v => update.mutate({ weightAskFrequency: v as Frequency })}
          ariaLabel='Как часто бот спрашивает вес'
        />
      </div>
    </ScreenSection>
  )
}

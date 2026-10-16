import { zodResolver } from '@hookform/resolvers/zod'
import { StarIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { type StarsAmountInput, starsAmountSchema, type StarsAmountValues } from '@/entities/stars'
import type { StarPaymentPurpose } from '@/shared/api/generated/model'
import { canPayStars } from '@/shared/miniapp'
import { BoxInput } from '@/shared/ui/kit/BoxInput'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { usePayStars } from './usePayStars'

const DEFAULT_PRESETS = [50, 100, 250, 500]

type PayStarsFormProps = {
  purpose: StarPaymentPurpose
  presets?: number[]
  /** Текст кнопки перед суммой: «Отправить 100 ⭐» */
  actionLabel?: string
  /** Звёзды списаны — потребитель показывает благодарность или открывает купленное */
  onPaid: (amount: number) => void
}

// Выбор суммы и оплата звёздами под любое назначение. Пресет кладёт число в то же поле, что и ручной ввод,
// поэтому сумма одна и проверяется одной схемой. Вне Telegram звёзд нет — форма не рисуется
export const PayStarsForm = ({ purpose, presets = DEFAULT_PRESETS, actionLabel = 'Отправить', onPaid }: PayStarsFormProps) => {
  const pay = usePayStars(purpose)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StarsAmountInput, unknown, StarsAmountValues>({
    resolver: zodResolver(starsAmountSchema),
    defaultValues: { amount: String(presets[1] ?? presets[0] ?? '') },
  })
  const amount = watch('amount')

  if (!canPayStars()) return null

  return (
    <form
      className='flex flex-col gap-4'
      onSubmit={handleSubmit(({ amount }) =>
        pay.mutateAsync(amount).then(status => {
          if (status === 'paid') onPaid(amount)
        }),
      )}
    >
      <div className='grid grid-cols-2 gap-2'>
        {presets.map(preset => (
          <Button
            key={preset}
            type='button'
            variant={amount === String(preset) ? 'default' : 'outline'}
            aria-pressed={amount === String(preset)}
            onClick={() => setValue('amount', String(preset), { shouldValidate: true })}
          >
            <Poster
              as='span'
              size='sm'
            >
              {preset}
            </Poster>
            <StarIcon
              className='size-4 fill-current'
              strokeWidth={2.5}
            />
          </Button>
        ))}
      </div>
      <div className='flex flex-col gap-1'>
        <BoxInput
          label='своя сумма, звёзд'
          inputMode='numeric'
          placeholder='—'
          aria-invalid={!!errors.amount}
          {...register('amount')}
        />
        <ErrorText errors={errors.amount} />
      </div>
      <Button
        type='submit'
        size='lg'
        disabled={pay.isPending}
      >
        {actionLabel} {/^\d+$/.test(amount.trim()) ? amount.trim() : ''}
        <StarIcon
          className='size-5 fill-current'
          strokeWidth={2.5}
        />
      </Button>
    </form>
  )
}

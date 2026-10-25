import { zodResolver } from '@hookform/resolvers/zod'
import { StarIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { type StarsAmountInput, starsAmountSchema, type StarsAmountValues } from '@sportbot/api/entities/stars'
import type { StarPaymentPurpose } from '@sportbot/api/generated/model'
import { canPayStars } from '@/shared/miniapp'
import { BoxInput } from '@/shared/ui/kit/BoxInput'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { StarsPresetTile } from './StarsPresetTile'
import { usePayStars } from './usePayStars'

export type StarsPreset = { amount: number; caption?: string }

const DEFAULT_PRESETS: StarsPreset[] = [{ amount: 50 }, { amount: 100 }, { amount: 250 }, { amount: 500 }]

type PayStarsFormProps = {
  purpose: StarPaymentPurpose
  /** Готовые суммы; caption — повод под числом */
  presets?: StarsPreset[]
  /** Текст кнопки перед суммой: «Спасибо · 100 ⭐» */
  actionLabel?: string
  /** Звёзды списаны — потребитель показывает благодарность или открывает купленное */
  onPaid: (amount: number) => void
}

// Выбор суммы и оплата звёздами под любое назначение. Пресет кладёт число в то же поле, что и ручной ввод,
// поэтому сумма одна и проверяется одной схемой. Вне Telegram звёзд нет — форма не рисуется
export const PayStarsForm = ({ purpose, presets = DEFAULT_PRESETS, actionLabel = 'Спасибо', onPaid }: PayStarsFormProps) => {
  const pay = usePayStars(purpose)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StarsAmountInput, unknown, StarsAmountValues>({
    resolver: zodResolver(starsAmountSchema),
    defaultValues: { amount: String((presets[1] ?? presets[0])?.amount ?? '') },
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
        {presets.map(({ amount: preset, caption }) => (
          <StarsPresetTile
            key={preset}
            amount={preset}
            caption={caption}
            selected={amount === String(preset)}
            onSelect={() => setValue('amount', String(preset), { shouldValidate: true })}
          />
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
        variant='gold'
        size='lg'
        disabled={pay.isPending}
      >
        {actionLabel}
        {/^\d+$/.test(amount.trim()) && ` · ${amount.trim()}`}
        <StarIcon
          className='size-5 fill-current'
          strokeWidth={2.5}
        />
      </Button>
    </form>
  )
}

import type { ComponentProps } from 'react'

import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Input } from '@/shared/ui/shadcn/input'

export type Term = 'date' | 'forever'

type TermFieldsProps = {
  term: Term
  onTermChange: (term: Term) => void
  /** register('endDate') формы */
  dateProps: ComponentProps<'input'>
  error?: { message?: string }
  dateLabel: string
}

// Срок «до даты» / «до отмены» — общий для паузы и ограничения по суставу
export const TermFields = ({ term, onTermChange, dateProps, error, dateLabel }: TermFieldsProps) => (
  <>
    <Segmented
      options={[
        { value: 'date', label: 'До даты' },
        { value: 'forever', label: 'До отмены' },
      ]}
      value={term}
      onValueChange={onTermChange}
      stretch
    />
    {term === 'date' && (
      <Input
        type='date'
        aria-label={dateLabel}
        aria-invalid={!!error}
        {...dateProps}
      />
    )}
    <ErrorText errors={error} />
  </>
)

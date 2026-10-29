import type { ReactNode } from 'react'

import type { ProgramComplex } from '@sportbot/api/entities/program'
import { Text } from '@/shared/ui/kit/Typography'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { Spinner } from '@/shared/ui/shadcn/spinner'

import { ComplexPlanList } from './ComplexPlanList'

type ComplexPreviewSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Шапка известна сразу — из строки, по которой открыли, пока состав грузится */
  title: string
  description?: ReactNode
  complex: ProgramComplex | undefined
  loading?: boolean
}

// Состав одной тренировки без ухода с экрана: например, следующей по расписанию в день отдыха.
// Данные приносит вызывающий — шторка ничего не запрашивает
export const ComplexPreviewSheet = ({
  open,
  onOpenChange,
  title,
  description,
  complex,
  loading,
}: ComplexPreviewSheetProps) => (
  <Sheet
    open={open}
    onOpenChange={onOpenChange}
  >
    <SheetContent fullHeight>
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
        {description && <SheetDescription>{description}</SheetDescription>}
      </SheetHeader>
      <div className='px-gutter flex min-h-0 flex-1 flex-col overflow-y-auto pb-6'>
        {loading && (
          <div
            className='flex justify-center py-10'
            aria-busy='true'
            aria-label='Загрузка'
          >
            <Spinner className='text-smoke size-6' />
          </div>
        )}
        {!loading && complex && complex.exercises.length === 0 && (
          <Text tone='muted'>В тренировке пока нет упражнений.</Text>
        )}
        {complex && complex.exercises.length > 0 && <ComplexPlanList complex={complex} />}
      </div>
    </SheetContent>
  </Sheet>
)

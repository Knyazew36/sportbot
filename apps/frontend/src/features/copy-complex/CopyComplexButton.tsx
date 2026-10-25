import { CopyPlusIcon } from 'lucide-react'

import { useState } from 'react'

import { useCopyComplex, usePrograms } from '@sportbot/api/entities/program'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { CopyTargetSheet } from './CopyTargetSheet'

type CopyComplexButtonProps = {
  complexId: number
  /** Программа открыта по ссылке «Поделиться» — сервер пускает к ней только с токеном */
  shareToken?: string
  /** После успешной копии — например, закрыть шторку */
  onDone?: () => void
}

// Одна тренировка чужой (или своей) программы — в конец выбранной своей программы.
// Программа одна — копируем сразу; несколько — выбор в шторке поверх
export const CopyComplexButton = ({ complexId, shareToken, onDone }: CopyComplexButtonProps) => {
  const copy = useCopyComplex()
  const programs = usePrograms()
  const [choosing, setChoosing] = useState(false)
  const list = programs.data ?? []

  const copyTo = (programId?: number) =>
    copy.mutate(
      { complexId, shareToken, programId },
      {
        onSuccess: () => {
          setChoosing(false)
          onDone?.()
        },
      },
    )

  return (
    <>
      <Button
        size='lg'
        className='w-full'
        disabled={copy.isPending || programs.isPending}
        // Одна программа (или ни одной — сервер подскажет) — выбирать не из чего
        onClick={() => (list.length > 1 ? setChoosing(true) : copyTo(list[0]?.id))}
      >
        <CopyPlusIcon />
        Скопировать к себе
      </Button>
      <CopyTargetSheet
        open={choosing}
        onOpenChange={setChoosing}
        programs={list}
        pending={copy.isPending}
        onPick={copyTo}
      />
    </>
  )
}

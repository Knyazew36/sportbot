import { ArrowRightIcon } from 'lucide-react'

import { useCreateBlankProgram } from '@/features/create-program/useCreateBlankProgram'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// Ничего не подошло — собрать программу с нуля
export const BlankProgramButton = () => {
  const blank = useCreateBlankProgram()
  return (
    <Button
      disabled={blank.isPending}
      onClick={() => void blank.create()}
    >
      Собрать свою
      <ArrowRightIcon />
    </Button>
  )
}

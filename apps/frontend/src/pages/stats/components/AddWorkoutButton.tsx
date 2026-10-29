import { PlusIcon } from 'lucide-react'

import { useState } from 'react'

import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { ManualWorkoutSheet } from './ManualWorkoutSheet'

// Забыл отметить тренировку в боте или приложении — добавить её в посещения задним числом
export const AddWorkoutButton = () => {
  const [open, setOpen] = useState(false)
  return (
    <div className='px-gutter'>
      <Button
        variant='outline'
        className='w-full'
        onClick={() => setOpen(true)}
      >
        <PlusIcon />
        Добавить тренировку вручную
      </Button>
      <ManualWorkoutSheet
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  )
}

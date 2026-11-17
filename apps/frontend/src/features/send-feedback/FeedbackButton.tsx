import { LightbulbIcon } from 'lucide-react'

import { useState } from 'react'

import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { FeedbackSheet } from './FeedbackSheet'

// Кнопка в шапке: открывает шторку «Идея или проблема»
export const FeedbackButton = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant='outline'
        size='xs'
        onClick={() => setOpen(true)}
      >
        <LightbulbIcon className='text-yellow-400 fill-yellow-400/30' />
        Идея
      </Button>
      <FeedbackSheet
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}

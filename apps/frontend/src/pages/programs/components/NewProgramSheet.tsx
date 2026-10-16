import { ArrowRightIcon, LayoutTemplateIcon } from 'lucide-react'

import { useCreateBlankProgram } from '@/features/create-program/useCreateBlankProgram'
import { ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

// «Новая программа»: из каталога или с нуля (frontend-tz, 10.1)
export const NewProgramSheet = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const blank = useCreateBlankProgram()

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Новая программа</SheetTitle>
          <SheetDescription>Подбери готовую в каталоге и поправь под себя или собери с чистого листа.</SheetDescription>
        </SheetHeader>
        <div className='px-gutter flex flex-col gap-3 pt-2 pb-6'>
          <ButtonLink
            to={ROUTES.PROGRAM_TEMPLATES}
            size='lg'
            className='w-full justify-between'
          >
            Из каталога
            <LayoutTemplateIcon className='size-6' />
          </ButtonLink>
          <Button
            variant='outline'
            size='lg'
            className='w-full justify-between'
            disabled={blank.isPending}
            onClick={() => void blank.create()}
          >
            Собрать с нуля
            <ArrowRightIcon className='size-6' />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

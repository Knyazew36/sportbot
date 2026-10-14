import { ArrowRightIcon, LayoutTemplateIcon } from 'lucide-react'
import { useNavigate } from 'react-router'

import { useCreateProgram } from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

// Название не спрашиваем: его меняют в редакторе, куда сразу и попадаем
const DEFAULT_NAME = 'Новая программа'

// «Новая программа»: из шаблона или с нуля (frontend-tz, 10.1)
export const NewProgramSheet = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const create = useCreateProgram()
  const navigate = useNavigate()

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent side='bottom'>
        <SheetHeader>
          <SheetTitle>Новая программа</SheetTitle>
          <SheetDescription>Возьми готовый шаблон и поправь под себя или собери с чистого листа.</SheetDescription>
        </SheetHeader>
        <div className='flex flex-col gap-3 px-gutter pt-2 pb-6'>
          <ButtonLink
            to={ROUTES.PROGRAM_TEMPLATES}
            size='lg'
            className='w-full justify-between'
          >
            Из шаблона
            <LayoutTemplateIcon className='size-6' />
          </ButtonLink>
          <Button
            variant='outline'
            size='lg'
            className='w-full justify-between'
            disabled={create.isPending}
            onClick={() =>
              create
                .mutateAsync(DEFAULT_NAME)
                .then(program => navigate(buildPath(ROUTES.PROGRAM, { programId: program.id })))
            }
          >
            Собрать с нуля
            <ArrowRightIcon className='size-6' />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

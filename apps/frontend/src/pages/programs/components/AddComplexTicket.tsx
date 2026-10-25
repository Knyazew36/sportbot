import { LibraryIcon, PlusIcon } from 'lucide-react'

import { useState } from 'react'
import { useNavigate } from 'react-router'

import { complexLetter, useAddComplex } from '@sportbot/api/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Ticket } from '@/shared/ui/kit/Ticket'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

type AddComplexTicketProps = {
  programId: number
  /** Сколько тренировок уже есть: новая получает следующую букву */
  count: number
}

// Последний билет очереди: новая тренировка — пустая в редакторе или копия из каталога программ
export const AddComplexTicket = ({ programId, count }: AddComplexTicketProps) => {
  const [open, setOpen] = useState(false)
  const add = useAddComplex()
  const navigate = useNavigate()

  const addBlank = () =>
    add.mutate(
      { programId, name: `Тренировка ${complexLetter(count)}` },
      {
        onSuccess: program => {
          const created = program.complexes.at(-1)
          if (created) navigate(buildPath(ROUTES.PROGRAM_COMPLEX, { programId, complexId: created.id }))
        },
      },
    )

  return (
    <>
      <Ticket
        kicker='Добавить'
        mark={
          <PlusIcon
            className='size-8'
            strokeWidth={2.5}
          />
        }
        title='Новая тренировка'
        className='h-[calc(100%-3px)] border-dashed'
        onClick={() => setOpen(true)}
      />
      <Sheet
        open={open}
        onOpenChange={setOpen}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Новая тренировка</SheetTitle>
            <SheetDescription>Встанет в конец очереди</SheetDescription>
          </SheetHeader>
          <div className='px-gutter pb-2'>
            <Text tone='soft'>
              Собери с нуля или возьми готовую: открой программу в каталоге, нажми на билет тренировки — «Скопировать
              к себе».
            </Text>
          </div>
          <SheetFooter className='border-foreground/15 flex-col gap-2 border-t-[1.5px]'>
            <Button
              size='lg'
              className='w-full'
              disabled={add.isPending}
              onClick={addBlank}
            >
              <PlusIcon strokeWidth={2.5} />
              Собрать с нуля
            </Button>
            <ButtonLink
              to={ROUTES.PROGRAM_TEMPLATES}
              variant='outline'
              size='lg'
              className='w-full'
            >
              <LibraryIcon />
              Из каталога программ
            </ButtonLink>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

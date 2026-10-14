import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRightIcon, LayoutTemplateIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'

import { type ProgramNameValues, programNameSchema, useCreateProgram } from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { applyFieldErrors } from '@/shared/lib/form'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { TextField } from '@/shared/ui/kit/TextField'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

// «С нуля»: только название — комплексы собираются уже в редакторе
const ScratchForm = () => {
  const create = useCreateProgram()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProgramNameValues>({
    resolver: zodResolver(programNameSchema),
    defaultValues: { name: '' },
  })

  return (
    <form
      className='flex flex-col gap-3'
      onSubmit={handleSubmit(({ name }) =>
        create
          .mutateAsync(name)
          .then(program => navigate(buildPath(ROUTES.PROGRAM, { programId: program.id })))
          .catch(error => applyFieldErrors(error, setError)),
      )}
    >
      <TextField
        label='Или с нуля — название'
        placeholder='Например, «Сила. Сплит на 3 дня»'
        error={errors.name}
        {...register('name')}
      />
      <Button
        type='submit'
        variant='outline'
        size='lg'
        className='w-full justify-between'
        disabled={create.isPending}
      >
        Собрать с нуля
        <ArrowRightIcon className='size-6' />
      </Button>
    </form>
  )
}

// «Новая программа»: из шаблона или с нуля (frontend-tz, 10.1)
export const NewProgramSheet = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
  <Sheet
    open={open}
    onOpenChange={onOpenChange}
  >
    <SheetContent side='bottom'>
      <SheetHeader>
        <SheetTitle>Новая программа</SheetTitle>
        <SheetDescription>Возьми готовый шаблон и поправь под себя или собери с чистого листа.</SheetDescription>
      </SheetHeader>
      <div className='flex flex-col gap-5 px-5 pt-2 pb-6'>
        <ButtonLink
          to={ROUTES.PROGRAM_TEMPLATES}
          size='lg'
          className='w-full justify-between'
        >
          Из шаблона
          <LayoutTemplateIcon className='size-6' />
        </ButtonLink>
        {open && <ScratchForm />}
      </div>
    </SheetContent>
  </Sheet>
)

import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'

import { useState } from 'react'

import { type TemplateMetaValues, templateMetaSchema, useAdminTemplates, useCreateTemplate } from '@/entities/admin'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { applyFieldErrors } from '@/shared/lib/form'
import { pluralize } from '@/shared/lib/format'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { TextField } from '@/shared/ui/kit/TextField'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

// Новый шаблон: название сразу, состав — уже в редакторе
const NewTemplateForm = () => {
  const create = useCreateTemplate()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TemplateMetaValues>({
    resolver: zodResolver(templateMetaSchema),
    defaultValues: { name: '', description: '' },
  })

  return (
    <form
      className='flex flex-col gap-3 px-gutter pb-6'
      onSubmit={handleSubmit(values =>
        create
          .mutateAsync({ name: values.name, description: values.description || undefined })
          .then(t => navigate(buildPath(ROUTES.ADMIN_TEMPLATE, { templateId: t.id })))
          .catch(error => applyFieldErrors(error, setError)),
      )}
    >
      <TextField
        label='Название шаблона'
        placeholder='Например, «Новичок. Фулбади»'
        error={errors.name}
        {...register('name')}
      />
      <Button
        type='submit'
        size='lg'
        className='w-full'
        disabled={create.isPending}
      >
        Создать и собрать
      </Button>
    </form>
  )
}

// Шаблоны программ: тот же редактор, что у программ пользователя, плюс описание (frontend-tz, 14.2)
export const TemplatesTab = () => {
  const templates = useAdminTemplates()
  const [open, setOpen] = useState(false)

  return (
    <Rise className='flex flex-col gap-3 px-gutter'>
      <div className='flex items-center justify-between gap-3'>
        <Eyebrow>шаблонов: {templates.data?.length ?? '—'}</Eyebrow>
        <Button
          size='sm'
          onClick={() => setOpen(true)}
        >
          <PlusIcon strokeWidth={2.5} />
          Новый шаблон
        </Button>
      </div>
      <QueryScreen
        query={templates}
        className=''
        isEmpty={list => list.length === 0}
        empty={{ title: 'Шаблонов нет', description: 'Создай первый — пользователи увидят его в «Взять».' }}
      >
        {list => (
          <List>
            {list.map(t => (
              <ListRow
                key={t.id}
                lead={String(t.complexes.length).padStart(2, '0')}
                className='relative'
                title={
                  <Link
                    to={buildPath(ROUTES.ADMIN_TEMPLATE, { templateId: t.id })}
                    className='underline-offset-4 after:absolute after:inset-0 hover:underline'
                  >
                    {t.name}
                  </Link>
                }
                meta={
                  t.complexes.map(c => c.name).join(' · ') ||
                  pluralize(t.complexes.length, ['комплекс', 'комплекса', 'комплексов'])
                }
              />
            ))}
          </List>
        )}
      </QueryScreen>

      <Sheet
        open={open}
        onOpenChange={setOpen}
      >
        <SheetContent side='bottom'>
          <SheetHeader>
            <SheetTitle>Новый шаблон</SheetTitle>
          </SheetHeader>
          {open && <NewTemplateForm />}
        </SheetContent>
      </Sheet>
    </Rise>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownIcon, ArrowUpIcon, CopyPlusIcon, PlusIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'

import { useState } from 'react'

import {
  templateMetaSchema,
  type TemplateMetaValues,
  useAdminTemplates,
  useCreateTemplate,
  useReorderTemplates,
  useTemplateFromProgram,
} from '@/entities/admin'
import { usePrograms } from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { applyFieldErrors } from '@/shared/lib/form'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { TextField } from '@/shared/ui/kit/TextField'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

import { ProgramTagsBlock } from './ProgramTagsBlock'

const COMPLEX_FORMS: [string, string, string] = ['тренировка', 'тренировки', 'тренировок']

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
    defaultValues: { name: '', description: '', tagIds: [] },
  })

  return (
    <form
      className='px-gutter flex flex-col gap-3 pb-6'
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

// «Из моей программы»: свою рабочую программу копией в шаблон — скрытым, оригинал остаётся
const FromProgramList = () => {
  const programs = usePrograms()
  const fromProgram = useTemplateFromProgram()
  const navigate = useNavigate()

  return (
    <QueryScreen
      query={programs}
      className='mx-gutter pb-6'
      isEmpty={list => list.length === 0}
      empty={{
        title: 'Своих программ нет',
        description: 'Собери программу в «Программах» — потом её можно сделать шаблоном.',
      }}
    >
      {list => (
        <List>
          {list.map(p => (
            <ListRow
              key={p.id}
              lead={String(p.complexCount).padStart(2, '0')}
              title={p.name}
              meta={pluralize(p.complexCount, COMPLEX_FORMS)}
              trail={
                <Button
                  size='xs'
                  variant='outline'
                  disabled={fromProgram.isPending}
                  onClick={() =>
                    void fromProgram
                      .mutateAsync(p.id)
                      .then(t => navigate(buildPath(ROUTES.ADMIN_TEMPLATE, { templateId: t.id })))
                  }
                >
                  Сделать шаблоном
                </Button>
              }
            />
          ))}
        </List>
      )}
    </QueryScreen>
  )
}

// Шаблоны программ: тот же редактор, что у программ пользователя, плюс описание (frontend-tz, 14.2).
// Порядок здесь — порядок каталога; скрытые пользователи не видят
export const TemplatesTab = () => {
  const templates = useAdminTemplates()
  const reorder = useReorderTemplates()
  // Какая шторка открыта: новый шаблон с нуля или из своей программы
  const [sheet, setSheet] = useState<'new' | 'from-program' | null>(null)

  const move = (ids: number[], index: number, shift: -1 | 1) => {
    const next = [...ids]
    const [item] = next.splice(index, 1)
    if (item === undefined) return
    next.splice(index + shift, 0, item)
    reorder.mutate(next)
  }

  return (
    <Rise className='px-gutter flex flex-col gap-3'>
      <ProgramTagsBlock />
      <div className='mt-4 flex items-center justify-between gap-3'>
        <Eyebrow>шаблонов: {templates.data?.length ?? '—'}</Eyebrow>
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={() => setSheet('from-program')}
          >
            <CopyPlusIcon />
            Из моей
          </Button>
          <Button
            size='sm'
            onClick={() => setSheet('new')}
          >
            <PlusIcon strokeWidth={2.5} />
            Новый
          </Button>
        </div>
      </div>
      <QueryScreen
        query={templates}
        className=''
        isEmpty={list => list.length === 0}
        empty={{ title: 'Шаблонов нет', description: 'Создай первый и покажи его в каталоге.' }}
      >
        {list => (
          <List>
            {list.map((t, i) => (
              <ListRow
                key={t.id}
                lead={String(i + 1).padStart(2, '0')}
                className='relative'
                title={
                  <Link
                    to={buildPath(ROUTES.ADMIN_TEMPLATE, { templateId: t.id })}
                    className='underline-offset-4 after:absolute after:inset-0 hover:underline'
                  >
                    {t.name}
                  </Link>
                }
                meta={[
                  t.tags.map(tag => tag.name).join(', '),
                  t.complexes.map(c => c.name).join(' · ') || pluralize(t.complexes.length, COMPLEX_FORMS),
                ]
                  .filter(Boolean)
                  .join(' — ')}
                trail={
                  // Поверх растянутой ссылки строки: стрелки нажимаются, а не открывают шаблон
                  <div className='relative z-10 flex gap-1'>
                    <Button
                      size='icon-sm'
                      variant='outline'
                      aria-label={`Выше: ${t.name}`}
                      disabled={i === 0 || reorder.isPending}
                      onClick={() =>
                        move(
                          list.map(x => x.id),
                          i,
                          -1,
                        )
                      }
                    >
                      <ArrowUpIcon />
                    </Button>
                    <Button
                      size='icon-sm'
                      variant='outline'
                      aria-label={`Ниже: ${t.name}`}
                      disabled={i === list.length - 1 || reorder.isPending}
                      onClick={() =>
                        move(
                          list.map(x => x.id),
                          i,
                          1,
                        )
                      }
                    >
                      <ArrowDownIcon />
                    </Button>
                  </div>
                }
              >
                {!t.isPublished && (
                  <Badge
                    variant='outline'
                    className='mt-2'
                  >
                    скрыт
                  </Badge>
                )}
              </ListRow>
            ))}
          </List>
        )}
      </QueryScreen>

      <Sheet
        open={sheet !== null}
        onOpenChange={open => !open && setSheet(null)}
      >
        <SheetContent>
          {sheet === 'new' && (
            <>
              <SheetHeader>
                <SheetTitle>Новый шаблон</SheetTitle>
                <SheetDescription>Появится скрытым — покажешь в каталоге, когда соберёшь.</SheetDescription>
              </SheetHeader>
              <NewTemplateForm />
            </>
          )}
          {sheet === 'from-program' && (
            <>
              <SheetHeader>
                <SheetTitle>Шаблон из моей программы</SheetTitle>
                <SheetDescription>
                  Состав скопируется в скрытый шаблон, твоя программа останется как есть. Черновики упражнений в шаблон
                  не попадут — сначала их должна одобрить модерация.
                </SheetDescription>
              </SheetHeader>
              <FromProgramList />
            </>
          )}
        </SheetContent>
      </Sheet>
    </Rise>
  )
}

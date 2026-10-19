import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, PlusIcon } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'

import { useState } from 'react'

import { useSaveStretch } from '@/entities/admin'
import {
  type StretchFormInput,
  stretchFormSchema,
  type StretchFormValues,
  useCreateDraft,
  useUploadEntryImage,
} from '@/entities/catalog'
import { useSportUser } from '@/entities/sport-user'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { applyFieldErrors } from '@/shared/lib/form'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

import { SimilarEntries } from './SimilarEntries'
import { StretchFields } from './StretchFields'

const FORM_ID = 'stretch-create'

type CreatedStretch = { id: number; name: string }

type StretchCreateSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CreateForm = ({
  isAdmin,
  onCreated,
}: {
  isAdmin: boolean
  onCreated: (stretch: CreatedStretch, pickedSimilar?: boolean) => void
}) => {
  const createDraft = useCreateDraft()
  const saveStretch = useSaveStretch()
  const upload = useUploadEntryImage()
  const pending = createDraft.isPending || saveStretch.isPending || upload.isPending
  const form = useForm<StretchFormInput, unknown, StretchFormValues>({
    resolver: zodResolver(stretchFormSchema),
    defaultValues: {
      name: '',
      howTo: '',
      steps: [],
      mistakes: [],
      holdSeconds: '30',
      perSide: true,
      kind: 'COOLDOWN',
      imagePath: null,
      muscles: [],
    },
  })

  // Админ добавляет сразу в справочник, пользователь — личной записью; публикация — отдельно, с карточки
  const save = (values: StretchFormValues): Promise<CreatedStretch> =>
    isAdmin
      ? saveStretch.mutateAsync({ id: null, ...values }).then(s => ({ id: s.id, name: s.name }))
      : createDraft
          .mutateAsync({
            kind: 'stretch',
            name: values.name,
            // У растяжки мышцы одного вида — в черновике они идут списком primary
            primary: values.muscles,
            technique: values.howTo ?? undefined,
            steps: values.steps,
            mistakes: values.mistakes,
            holdSeconds: values.holdSeconds,
            perSide: values.perSide,
            imagePath: values.imagePath ?? undefined,
          })
          // У только что созданного черновика запись есть всегда — null бывает лишь у удалённых
          .then(entry => ({ id: entry.id, name: entry.name }))

  return (
    <FormProvider {...form}>
      <form
        id={FORM_ID}
        className='flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain pt-1 pb-4'
        onSubmit={form.handleSubmit(values =>
          save(values)
            .then(created => onCreated(created))
            .catch(error => applyFieldErrors(error, form.setError)),
        )}
      >
        <StretchFields
          initialImageUrl={null}
          upload={upload}
          showKind={isAdmin}
          afterName={name => (
            <SimilarEntries
              kind='stretch'
              name={name}
              hint='Не то? Заполни поля ниже — создадим новое.'
              onPick={entry => onCreated(entry, true)}
            />
          )}
        />
      </form>
      <SheetFooter className='border-foreground/15 border-t-[1.5px]'>
        <Button
          type='submit'
          form={FORM_ID}
          size='lg'
          className='w-full'
          disabled={pending}
        >
          <PlusIcon strokeWidth={2.5} />
          {isAdmin ? 'Добавить в справочник' : 'Сохранить'}
        </Button>
      </SheetFooter>
    </FormProvider>
  )
}

// Новая растяжка (business-tz, 5.5) — как новое упражнение: у пользователя личная запись, админ добавляет сразу в справочник
export const StretchCreateSheet = ({ open, onOpenChange }: StretchCreateSheetProps) => {
  const navigate = useNavigate()
  const isAdmin = useSportUser().data?.isAdmin ?? false
  const [created, setCreated] = useState<CreatedStretch | null>(null)

  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) setCreated(null)
  }

  const done = (stretch: CreatedStretch, pickedSimilar?: boolean) => {
    if (pickedSimilar) {
      // Похожее уже есть в справочнике — показываем его карточку вместо создания дубля
      close(false)
      void navigate(buildPath(ROUTES.STRETCH, { stretchId: stretch.id }))
    } else setCreated(stretch)
  }

  const title = created ? (isAdmin ? 'Добавлено' : 'Сохранено') : 'Новая растяжка'
  const description = created
    ? isAdmin
      ? `«${created.name}» уже в справочнике.`
      : `«${created.name}» уже может попасть в твою заминку. Чтобы она появилась в общем справочнике, нажми «Опубликовать» на карточке.`
    : isAdmin
      ? 'Запись сразу попадёт в справочник.'
      : 'Будет видна только тебе. В общий справочник — по кнопке «Опубликовать», после проверки.'

  return (
    <Sheet
      open={open}
      onOpenChange={close}
    >
      <SheetContent className={created ? undefined : 'data-[side=bottom]:h-[88svh]'}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {created ? (
          <div className='px-gutter flex flex-col gap-3 pb-6'>
            <ButtonLink
              to={buildPath(ROUTES.STRETCH, { stretchId: created.id })}
              variant='outline'
              className='w-full'
            >
              Открыть карточку
            </ButtonLink>
            <Button
              className='w-full'
              onClick={() => close(false)}
            >
              <CheckIcon strokeWidth={3} />
              Готово
            </Button>
          </div>
        ) : (
          open && (
            <CreateForm
              isAdmin={isAdmin}
              onCreated={done}
            />
          )
        )}
      </SheetContent>
    </Sheet>
  )
}

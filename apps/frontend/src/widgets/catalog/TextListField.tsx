import { PlusIcon, XIcon } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'

import { TEXT_LIST_MAX, type TextListInput } from '@/entities/catalog'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'

type ListForm = { steps: TextListInput; mistakes: TextListInput }

type TextListFieldProps = {
  name: keyof ListForm
  label: string
  placeholder: string
  addLabel: string
}

// Шаги или ошибки записи: каждый пункт — отдельное поле, поэтому разбирать текст не нужно.
// Общий для упражнения и растяжки, у пользователя и у админа
export const TextListField = ({ name, label, placeholder, addLabel }: TextListFieldProps) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ListForm>()
  const { fields, append, remove } = useFieldArray({ control, name })
  const listErrors = errors[name]

  return (
    <div className='flex flex-col gap-2'>
      <Label>{label}</Label>
      {fields.length > 0 && (
        <ol className='flex flex-col gap-2'>
          {fields.map((field, i) => (
            <li
              key={field.id}
              className='grid grid-cols-[24px_1fr_auto] items-start gap-2'
            >
              <Poster
                as='span'
                size='sm'
                tone='primary'
                numeric
                className='pt-3'
              >
                {i + 1}
              </Poster>
              <div className='flex flex-col gap-1'>
                <Textarea
                  placeholder={placeholder}
                  aria-label={`${label}: пункт ${i + 1}`}
                  aria-invalid={!!listErrors?.[i]?.value}
                  className='min-h-12'
                  {...register(`${name}.${i}.value`)}
                />
                <ErrorText errors={listErrors?.[i]?.value} />
              </div>
              <Button
                type='button'
                variant='outline'
                size='icon-sm'
                className='mt-1.5'
                aria-label={`Убрать пункт ${i + 1}`}
                onClick={() => remove(i)}
              >
                <XIcon strokeWidth={2.5} />
              </Button>
            </li>
          ))}
        </ol>
      )}
      <ErrorText errors={listErrors?.root ?? listErrors} />
      <Button
        type='button'
        variant='outline'
        size='sm'
        className='self-start'
        disabled={fields.length >= TEXT_LIST_MAX}
        onClick={() => append({ value: '' })}
      >
        <PlusIcon strokeWidth={2.5} />
        {addLabel}
      </Button>
    </div>
  )
}

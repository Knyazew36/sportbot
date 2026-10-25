import { Controller, useForm, useWatch } from 'react-hook-form'

import { useApproveProgramTag, useRejectProgramTag, useReplaceProgramTag } from '@sportbot/api/entities/admin'
import type { ProgramTag, ProgramTagGroup } from '@sportbot/api/entities/program'
import { SelectField } from '@/shared/ui/kit/SelectField'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type PendingTagRowProps = {
  tag: ProgramTag
  /** Группа тега: из её тегов справочника выбирают замену */
  group: ProgramTagGroup | undefined
}

// Свой тег автора: в справочник, заменить на тег той же группы (дубль «Зал»/«зал») или отклонить
export const PendingTagRow = ({ tag, group }: PendingTagRowProps) => {
  const approve = useApproveProgramTag()
  const replace = useReplaceProgramTag()
  const reject = useRejectProgramTag()
  const busy = approve.isPending || replace.isPending || reject.isPending
  const options = (group?.tags ?? []).map(t => ({ value: String(t.id), label: t.name }))
  const { control, handleSubmit } = useForm<{ targetId: string }>({ defaultValues: { targetId: '' } })
  const targetId = useWatch({ control, name: 'targetId' })

  return (
    <div className='border-foreground/80 flex flex-col gap-3 border-[1.5px] p-3'>
      <div>
        <Eyebrow as='p'>{group?.name ?? 'Группа'}</Eyebrow>
        <Text className='font-medium'>{tag.name}</Text>
      </div>
      <div className='grid grid-cols-2 gap-2'>
        <Button
          size='sm'
          className='h-11'
          disabled={busy}
          onClick={() => approve.mutate(tag.id)}
        >
          В справочник
        </Button>
        <Button
          variant='outline'
          size='sm'
          className='h-11'
          disabled={busy}
          onClick={() => reject.mutate(tag.id)}
        >
          Отклонить
        </Button>
      </div>
      {options.length > 0 && (
        <div className='grid grid-cols-[1fr_auto] gap-2'>
          <Controller
            control={control}
            name='targetId'
            render={({ field }) => (
              <SelectField
                options={[{ value: '', label: 'Заменить на…' }, ...options]}
                value={field.value}
                onValueChange={field.onChange}
                ariaLabel={`Заменить тег «${tag.name}»`}
              />
            )}
          />
          <Button
            variant='outline'
            size='sm'
            className='h-11'
            disabled={busy || !targetId}
            onClick={handleSubmit(({ targetId }) => replace.mutate({ tagId: tag.id, targetId: Number(targetId) }))}
          >
            Заменить
          </Button>
        </div>
      )}
    </div>
  )
}

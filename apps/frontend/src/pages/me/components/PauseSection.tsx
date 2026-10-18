import { zodResolver } from '@hookform/resolvers/zod'
import { PauseIcon } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'

import { useEndPause, useStartPause } from '@/entities/pause'
import { type PauseInput, pauseSchema, type Profile } from '@/entities/profile'
import { applyFieldErrors } from '@/shared/lib/form'
import { formatDate } from '@/shared/lib/format'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { TermFields } from './TermFields'

const PauseForm = () => {
  const start = useStartPause()
  const {
    control,
    handleSubmit,
    register,
    setValue,
    setError,
    formState: { errors },
  } = useForm<PauseInput, unknown, string | null>({
    resolver: zodResolver(pauseSchema),
    defaultValues: { term: 'date', endDate: '' },
  })
  const term = useWatch({ control, name: 'term' })

  return (
    <form
      className='flex flex-col gap-3'
      onSubmit={handleSubmit(endDate => start.mutateAsync(endDate).catch(error => applyFieldErrors(error, setError)))}
    >
      <Text tone='soft'>Бот замолчит, а серия не сгорит — например, на время отпуска или болезни.</Text>
      <TermFields
        term={term}
        onTermChange={v => setValue('term', v)}
        dateProps={register('endDate')}
        error={errors.endDate}
        dateLabel='Дата окончания паузы'
      />
      <Button
        type='submit'
        variant='outline'
        className='w-full'
        disabled={start.isPending}
      >
        <PauseIcon />
        Поставить паузу
      </Button>
    </form>
  )
}

// Пауза «до даты» или «до отмены», снять досрочно (frontend-tz, 13.3)
export const PauseSection = ({ profile }: { profile: Profile }) => {
  const end = useEndPause()

  return (
    <ScreenSection aside='серия сохраняется'>
      {profile.pause ? (
        <div className='hatch border-border flex items-center justify-between gap-3 border-[1.5px] p-4'>
          <div className='bg-background px-1'>
            <Poster>{profile.pause.expired ? 'Пауза закончилась' : 'На паузе'}</Poster>
            <Text
              size='xs'
              tone='muted'
            >
              {profile.pause.endDate ? `до ${formatDate(profile.pause.endDate, 'd MMMM')}` : 'до отмены'}
            </Text>
          </div>
          <Button
            size='sm'
            disabled={end.isPending}
            onClick={() => end.mutate()}
          >
            {profile.pause.expired ? 'Вернуться' : 'Снять'}
          </Button>
        </div>
      ) : (
        <PauseForm />
      )}
    </ScreenSection>
  )
}

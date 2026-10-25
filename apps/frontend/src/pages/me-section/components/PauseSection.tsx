import { zodResolver } from '@hookform/resolvers/zod'
import { PauseIcon } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'

import { useEndPause, useStartPause } from '@sportbot/api/entities/pause'
import { type PauseInput, pauseSchema, type Profile } from '@sportbot/api/entities/profile'
import { applyFieldErrors } from '@/shared/lib/form'
import { formatDate } from '@/shared/lib/format'
import { Notice } from '@/shared/ui/kit/Notice'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Text } from '@/shared/ui/kit/Typography'
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
        <Notice
          kicker={profile.pause.endDate ? `до ${formatDate(profile.pause.endDate, 'd MMMM')}` : 'до отмены'}
          title={profile.pause.expired ? 'Пауза закончилась' : 'На паузе'}
          action={
            <Button
              size='sm'
              disabled={end.isPending}
              onClick={() => end.mutate()}
            >
              {profile.pause.expired ? 'Вернуться' : 'Снять'}
            </Button>
          }
        />
      ) : (
        <PauseForm />
      )}
    </ScreenSection>
  )
}

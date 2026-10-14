import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import {
  type DisplayNameValues,
  displayNameSchema,
  type Profile,
  useProfile,
  useUpdateProfile,
} from '@/entities/profile'
import { sportUserKeys } from '@/entities/sport-user'
import { useStatsSummary } from '@/entities/stats'
import { applyFieldErrors } from '@/shared/lib/form'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { TextField } from '@/shared/ui/kit/TextField'
import { Eyebrow, Lead, Poster } from '@/shared/ui/kit/Typography'

import { BodyWeightSection } from './components/BodyWeightSection'
import { DeleteDataSection } from './components/DeleteDataSection'
import { FriendsSection } from './components/FriendsSection'
import { LimitsSection } from './components/LimitsSection'
import { MessengersSection } from './components/MessengersSection'
import { PauseSection } from './components/PauseSection'
import { ScheduleSection } from './components/ScheduleSection'
import { TrainingSection } from './components/TrainingSection'

// Имя, которое видят друзья: сохраняется при уходе из поля
const NameForm = ({ profile }: { profile: Profile }) => {
  const update = useUpdateProfile()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DisplayNameValues>({
    resolver: zodResolver(displayNameSchema),
    values: { displayName: profile.displayName },
  })

  const save = handleSubmit(({ displayName }) => {
    if (displayName === profile.displayName) return
    return update
      .mutateAsync({ displayName })
      .then(() => queryClient.invalidateQueries({ queryKey: sportUserKeys.me }))
      .catch(error => applyFieldErrors(error, setError))
  })

  return (
    <form onSubmit={save}>
      <TextField
        label='Имя для друзей'
        error={errors.displayName}
        {...register('displayName', { onBlur: () => void save() })}
      />
    </form>
  )
}

// Профиль: все настройки на одном экране секциями (frontend-tz, 13)
const MePage = () => {
  const profile = useProfile()
  const summary = useStatsSummary()

  return (
    <Screen
      header={<ScreenHeader title='Профиль' />}
      className='gap-12'
    >
      <QueryScreen query={profile}>
        {p => (
          <>
            <Rise className='flex flex-col gap-4 px-5'>
              <div className='flex items-end justify-between gap-4'>
                <div className='min-w-0'>
                  <Lead>привет,</Lead>
                  <Poster
                    as='h1'
                    size='4xl'
                    tone='primary'
                    fit
                  >
                    {p.displayName}
                  </Poster>
                </div>
                {summary.data && (
                  <div className='border-foreground/80 shrink-0 border-[1.5px] px-3 py-2 text-center'>
                    <Eyebrow as='p'>серия</Eyebrow>
                    <Poster
                      size='2xl'
                      tone='primary'
                    >
                      {summary.data.currentStreak}
                    </Poster>
                  </div>
                )}
              </div>
              <NameForm profile={p} />
            </Rise>

            <ScheduleSection profile={p} />
            <TrainingSection profile={p} />
            <PauseSection profile={p} />
            <LimitsSection />
            <BodyWeightSection profile={p} />
            <FriendsSection />
            <MessengersSection />
            <DeleteDataSection />
          </>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default MePage

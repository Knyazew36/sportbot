import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import {
  displayNameSchema,
  type DisplayNameValues,
  type Profile,
  useUpdateProfile,
} from '@/entities/profile'
import { sportUserKeys } from '@/entities/sport-user'
import { applyFieldErrors } from '@/shared/lib/form'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { TextField } from '@/shared/ui/kit/TextField'

import { GenderField } from './GenderField'

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

// Имя и пол: имя видят друзья, пол заодно подбирает расцветку. Фото меняют на карте участника
export const AboutSection = ({ profile }: { profile: Profile }) => (
  <ScreenSection className='gap-5'>
    <NameForm profile={profile} />
    <GenderField profile={profile} />
  </ScreenSection>
)

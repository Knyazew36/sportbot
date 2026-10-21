import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Notice } from '@/shared/ui/kit/Notice'
import { Rise } from '@/shared/ui/kit/Reveal'

// Заминку предлагали до итога; кто пропустил — возвращаем сюда. Сделанную не навязываем повторно
export const CooldownNudge = ({ workoutId }: { workoutId: number }) => (
  <Rise className='px-gutter'>
    <Notice
      kicker='заминка пропущена'
      description='Ещё не поздно растянуть мышцы, которые работали.'
      action={
        <ButtonLink
          to={buildPath(ROUTES.COOLDOWN, { workoutId })}
          variant='outline'
          size='sm'
        >
          Заминка
        </ButtonLink>
      }
    />
  </Rise>
)

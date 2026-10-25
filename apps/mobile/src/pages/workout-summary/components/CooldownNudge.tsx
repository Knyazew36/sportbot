import { ROUTES } from '@/shared/config/routes';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Notice } from '@/shared/ui/kit/Notice';
import { Rise } from '@/shared/ui/kit/Reveal';

// Заминку предлагали до итога; кто пропустил — возвращаем сюда. Сделанную не навязываем повторно
export const CooldownNudge = ({ workoutId }: { workoutId: number }) => (
  <Rise className="px-gutter">
  <Notice
    kicker="заминка пропущена"
    description="Ещё не поздно растянуть мышцы, которые работали."
    action={
      <ButtonLink
        href={{ pathname: ROUTES.COOLDOWN, params: { workoutId: String(workoutId) } }}
        variant="outline"
        size="sm"
      >
        Заминка
      </ButtonLink>
    }
  />
  </Rise>
);

import { Plus } from 'lucide-react-native';

import type { Program } from '@sportbot/api/entities/program';

import { routeHref, ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { StickyFooter } from '@/shared/ui/kit/Screen';

type TakeFooterProps = {
  program: Program;
  onTake: () => void;
  pending: boolean;
};

// «Взять себе» под чужой программой — порт widgets/program-details/TakeFooter.tsx: из каталога и по ссылке «Поделиться»
export const TakeFooter = ({ program, onTake, pending }: TakeFooterProps) => {
  if (program.mine)
    return (
      // Своя программа: брать копию у себя незачем — открываем её редактор
      <StickyFooter>
        <ButtonLink href={routeHref(ROUTES.PROGRAM, { programId: program.id })} size="lg" block className="flex-1">
          Открыть мою
        </ButtonLink>
      </StickyFooter>
    );

  const taken = program.takenProgramId != null;
  return (
    // Две кнопки держим в одну строку: обе lg и короткие подписи, чтобы влезали от 375px
    <StickyFooter className="flex-nowrap">
      {/* Уже взята — главное «Открыть»; второй экземпляр берут осознанно */}
      {taken && (
        <ButtonLink
          href={routeHref(ROUTES.PROGRAM, { programId: program.takenProgramId! })}
          size="lg"
          block
          className="flex-1"
        >
          Открыть мою
        </ButtonLink>
      )}
      <Button size="lg" variant={taken ? 'outline' : 'default'} loading={pending} iconRight={Plus} onPress={onTake}>
        {taken ? 'Ещё раз' : 'Взять себе'}
      </Button>
    </StickyFooter>
  );
};

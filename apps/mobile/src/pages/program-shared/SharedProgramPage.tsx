import { router, useLocalSearchParams } from 'expo-router';
import { Link } from 'lucide-react-native';

import { useSharedProgram, useTakeSharedProgram } from '@sportbot/api/entities/program';

import { getApiErrorStatus } from '@/shared/api';
import { routeHref, ROUTES } from '@/shared/config/routes';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { ScreenState } from '@/shared/ui/kit/ScreenState';
import { ProgramDetails } from '@/widgets/program-details/ProgramDetails';
import { TakeFooter } from '@/widgets/program-details/TakeFooter';

// Ссылка ведёт сюда снаружи — «Назад» уводит к программам, а не в пустую историю
const toPrograms = () => router.dismissTo(ROUTES.PROGRAMS);

// Программа по ссылке «Поделиться»: открыть и взять себе может любой пользователь бота, не только друг
const SharedProgramPage = () => {
  const { token = '' } = useLocalSearchParams<{ token: string }>();
  const program = useSharedProgram(token);
  const take = useTakeSharedProgram();
  const gone = getApiErrorStatus(program.error) === 404;

  return (
    <Screen
      fullscreen
      header={
        <TopBar
          back={toPrograms}
          title={program.data?.name ?? 'Программа'}
          subtitle={gone ? undefined : 'поделились программой'}
        />
      }
      footer={
        program.data ? (
          <TakeFooter
            program={program.data}
            pending={take.isPending}
            onTake={() =>
              take.mutate(token, {
                onSuccess: (copy) => router.push(routeHref(ROUTES.PROGRAM, { programId: copy.id })),
              })
            }
          />
        ) : (
          <StickyFooter />
        )
      }
    >
      {gone ? (
        <ScreenState
          state="empty"
          icon={Link}
          title="Ссылка устарела"
          description="Эту программу удалили."
          className="mx-gutter mt-10"
        />
      ) : (
        <QueryState query={program}>{(p) => <ProgramDetails program={p} shareToken={token} />}</QueryState>
      )}
    </Screen>
  );
};

export default SharedProgramPage;

import { pluralize } from '@front-cmdt/utils/pluralize';

import { usePrograms } from '@sportbot/api/entities/program';

import { PROGRAM_FORMS } from '@/shared/lib/plural-forms';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { MyPrograms } from '@/widgets/my-programs/MyPrograms';

// Все свои программы: на главной программ только первые несколько, здесь — целиком, активная первой
const MyProgramsPage = () => {
  const programs = usePrograms();

  return (
    <Screen
      fullscreen
      header={
        <TopBar
          title="Мои программы"
          subtitle={programs.data ? pluralize(programs.data.length, PROGRAM_FORMS) : undefined}
        />
      }
    >
      <QueryState
        query={programs}
        isEmpty={(list) => list.length === 0}
        empty={{ title: 'Программ пока нет', description: 'Подбери готовую в каталоге или собери свою.' }}
      >
        {(list) => <MyPrograms programs={[...list].sort((a, b) => Number(b.active) - Number(a.active))} deletable />}
      </QueryState>
    </Screen>
  );
};

export default MyProgramsPage;

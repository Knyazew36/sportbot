import { router, useLocalSearchParams } from 'expo-router';

import { type Program, useProgram } from '@sportbot/api/entities/program';

import { routeHref, routePath, ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/kit/Button';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { ComplexEditor } from '@/widgets/program-editor/ComplexEditor';

import { useComplexActions } from './model/use-complex-actions';

// Комплекс программы на отдельном экране (frontend-tz, 10.3): название и упражнения с планом.
// Отдельно от списка комплексов, чтобы редактор программы не превращался в стену полей
const ComplexPage = () => {
  const params = useLocalSearchParams<{ programId: string; complexId: string }>();
  const programId = Number(params.programId);
  const complexId = Number(params.complexId);
  const program = useProgram(programId);
  // В тренировку попадают и с главной программ (новая тренировка) — возвращаем всё равно в программу
  const back = () => router.dismissTo(routeHref(ROUTES.PROGRAM, { programId }));
  const { view, actions } = useComplexActions(programId, complexId, back);
  const pick = (p: Program) => {
    const complex = p.complexes.find((c) => c.id === complexId);
    return complex && view(complex);
  };

  return (
    <Screen
      fullscreen
      header={
        <TopBar
          back={back}
          title={program.data?.complexes.find((c) => c.id === complexId)?.name ?? 'Тренировка'}
          action={
            // Правки уже ушли на сервер по ходу; кнопка подтверждает и возвращает в программу
            <Button variant="success" size="sm" onPress={back}>
              Сохранить
            </Button>
          }
        />
      }
    >
      <QueryState
        query={program}
        isEmpty={(p) => !pick(p)}
        empty={{ title: 'Тренировки нет', description: 'Её уже удалили. Вернись в программу.' }}
      >
        {(p) => {
          const complex = pick(p);
          return (
            complex && (
              <ComplexEditor
                complex={complex}
                actions={actions(complex)}
                addExerciseTo={routePath(ROUTES.PROGRAM_ADD_EXERCISE, { programId, complexId })}
              />
            )
          );
        }}
      </QueryState>
    </Screen>
  );
};

export default ComplexPage;

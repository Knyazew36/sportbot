import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { pluralize } from '@front-cmdt/utils/pluralize';
import { Trash2 } from 'lucide-react-native';

import { useActivateProgram, useDeleteProgram, useProgram } from '@/shared/local/entities/program';

import { routePath, ROUTES } from '@/shared/config/routes';
import { WORKOUT_FORMS } from '@/shared/lib/plural-forms';
import { Button } from '@/shared/ui/kit/Button';
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { ProgramComplexList } from '@/widgets/program-editor/ProgramComplexList';

import { ProgramNameForm } from './components/ProgramNameForm';
import { PublishBlock } from './components/PublishBlock';
import { useListActions } from './model/use-list-actions';

// В редактор попадают и из каталога после «Взять себе» — «Назад» ведёт к программам, а не в каталог
const toPrograms = () => router.dismissTo(ROUTES.PROGRAMS);

// Редактор программы (frontend-tz, 10.3): шапка (название и активность), затем нумерованные блоки — тренировки
// и каталог; удаление тихой кнопкой в самом низу, чтобы не спорило с основными действиями.
// Упражнения правятся на экране тренировки
const ProgramEditorPage = () => {
  const params = useLocalSearchParams<{ programId: string }>();
  const programId = Number(params.programId);
  const program = useProgram(programId);
  const activate = useActivateProgram();
  const remove = useDeleteProgram();
  const { actions, arrange, adding } = useListActions(programId);

  return (
    <Screen
      fullscreen
      header={
        <TopBar
          back={toPrograms}
          title={program.data?.name ?? 'Программа'}
          subtitle={
            program.data
              ? `${pluralize(program.data.complexes.length, WORKOUT_FORMS)}${program.data.active ? ' · активная' : ''}`
              : undefined
          }
          action={
            <Button variant="success" size="sm" onPress={toPrograms}>
              Готово
            </Button>
          }
        />
      }
    >
      <QueryState query={program}>
        {(p) => (
          <>
            <Rise className="px-gutter gap-3">
              <ProgramNameForm program={p} />
              {/* Активную видно по подзаголовку шапки — отдельная строка дублировала бы его */}
              {!p.active && (
                <View className="items-end">
                  <Button variant="success" size="sm" loading={activate.isPending} onPress={() => activate.mutate(p.id)}>
                    Сделать активной
                  </Button>
                </View>
              )}
            </Rise>

            <ProgramComplexList
              index={1}
              complexes={arrange(p)}
              actions={actions}
              adding={adding}
              complexTo={(complexId) => routePath(ROUTES.PROGRAM_COMPLEX, { programId: p.id, complexId })}
            />

            <PublishBlock program={p} index={2} />

            <Rise className="px-gutter">
              <ConfirmAction
                trigger={<Button variant="ghost" block icon={Trash2} />}
                title="Удалить программу?"
                description={
                  p.publication === 'DRAFT'
                    ? 'Программа и её тренировки пропадут. История тренировок сохранится.'
                    : 'Программа пропадёт и из каталога. У тех, кто её взял, копии останутся. История тренировок сохранится.'
                }
                confirmLabel="Удалить"
                onConfirm={() => remove.mutateAsync(p.id).then(toPrograms)}
              >
                Удалить программу
              </ConfirmAction>
            </Rise>
          </>
        )}
      </QueryState>
    </Screen>
  );
};

export default ProgramEditorPage;

import { planText, type ProgramComplex } from '@sportbot/api/entities/program';

import { ExerciseBlocks } from '@/shared/ui/kit/ExerciseBlocks';
import { List, ListRow } from '@/shared/ui/kit/ListRow';
import { Poster } from '@/shared/ui/kit/Typography';

type ComplexPlanListProps = {
  complex: Pick<ProgramComplex, 'exercises' | 'cardioName' | 'cardioMinutes'>;
  /** Разминка перед упражнением 01 — нулевым номером; номера строк только вместе с ней */
  warmupMinutes?: number | null;
  /** Номера строк слева: «01», «A1» у суперсета */
  numbered?: boolean;
};

// План тренировки в шторках — порт widgets/program-preview/ComplexPlanList.tsx и тела ComplexSheet:
// упражнения с подходами, суперсеты с корешком, кардио в конце
export const ComplexPlanList = ({ complex, warmupMinutes, numbered }: ComplexPlanListProps) => (
  <List>
    {warmupMinutes ? (
      <ListRow lead="00" title="Разминка" trail={<Poster numberOfLines={1}>{`${warmupMinutes} мин`}</Poster>} />
    ) : null}
    <ExerciseBlocks items={complex.exercises}>
      {(e, i, label, last) => (
        <ListRow
          key={e.id}
          last={last}
          lead={numbered ? (label ?? String(i + 1).padStart(2, '0')) : undefined}
          title={e.name}
          meta={e.muscles || undefined}
          trail={
            <Poster size={numbered ? 'md' : 'xs'} numberOfLines={1}>
              {planText(e.sets, e.repsMin, e.repsMax, e.measure)}
            </Poster>
          }
        />
      )}
    </ExerciseBlocks>
    {complex.cardioName ? (
      <ListRow
        lead={numbered ? '+' : undefined}
        title={complex.cardioName}
        meta="кардио"
        trail={
          complex.cardioMinutes ? (
            <Poster size={numbered ? 'md' : 'xs'} numberOfLines={1}>{`${complex.cardioMinutes} мин`}</Poster>
          ) : undefined
        }
      />
    ) : null}
  </List>
);

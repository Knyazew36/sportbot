import { planText, type ProgramComplex } from '@sportbot/api/entities/program'
import { ExerciseBlocks } from '@/shared/ui/kit/ExerciseBlocks'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Poster } from '@/shared/ui/kit/Typography'

// План тренировки в шторках: упражнения с подходами, суперсеты в рамке, кардио в конце
export const ComplexPlanList = ({ complex }: { complex: ProgramComplex }) => (
  <List>
    <ExerciseBlocks items={complex.exercises}>
      {e => (
        <ListRow
          key={e.id}
          title={e.name}
          meta={e.muscles}
          trail={
            <Poster
              as='span'
              size='xs'
              className='whitespace-nowrap'
            >
              {planText(e.sets, e.repsMin, e.repsMax, e.measure)}
            </Poster>
          }
        />
      )}
    </ExerciseBlocks>
    {complex.cardioName && (
      <ListRow
        title={complex.cardioName}
        meta='кардио'
        trail={
          complex.cardioMinutes ? (
            <Poster
              as='span'
              size='xs'
              className='whitespace-nowrap'
            >
              {complex.cardioMinutes} мин
            </Poster>
          ) : undefined
        }
      />
    )}
  </List>
)

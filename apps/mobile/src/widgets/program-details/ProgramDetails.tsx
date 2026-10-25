import { useState } from 'react';
import { View } from 'react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { addedText, complexLetter, planText, type Program } from '@sportbot/api/entities/program';

import { CopyComplexButton } from '@/features/copy-complex/CopyComplexButton';
import { toAssetUrl } from '@/shared/api';
import { routeHref, ROUTES } from '@/shared/config/routes';
import { EXERCISE_FORMS, SET_FORMS } from '@/shared/lib/plural-forms';
import { cn } from '@/shared/lib/utils';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { ExerciseBlocks } from '@/shared/ui/kit/ExerciseBlocks';
import { List, ListRow } from '@/shared/ui/kit/ListRow';
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar';
import { Rise } from '@/shared/ui/kit/Reveal';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { StatGrid } from '@/shared/ui/kit/StatGrid';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';
import { ComplexQueue } from '@/widgets/complex-queue/ComplexQueue';
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet';

type ProgramDetailsProps = {
  program: Program;
  /** Программа открыта по ссылке «Поделиться»: токен нужен, чтобы скопировать из неё тренировку */
  shareToken?: string;
};

// Чужая программа целиком, прежде чем взять себе — порт widgets/program-details/ProgramDetails.tsx:
// из каталога и по ссылке «Поделиться». Тренировку из очереди можно скопировать к себе по одной — в шторке билета
export const ProgramDetails = ({ program, shareToken }: ProgramDetailsProps) => {
  // Упражнение, открытое в шторке: состав видно, не уходя с экрана программы
  const [opened, setOpened] = useState<{ id: number; name: string } | null>(null);
  const exercises = program.complexes.reduce((sum, c) => sum + c.exercises.length, 0);

  return (
    <>
      <Rise className="px-gutter">
        <Poster size="3xl" tone="primary">
          {program.name}
        </Poster>
        {program.author && (
          <View className="mt-3 flex-row items-center gap-2">
            <PersonAvatar name={program.author.name} src={toAssetUrl(program.author.avatarUrl)} size="sm" />
            <Text size="sm" tone="muted">
              {program.mine ? 'Твоя программа' : program.author.name}
            </Text>
          </View>
        )}
        {program.description ? (
          <Text tone="soft" className="mt-3">
            {program.description}
          </Text>
        ) : null}
        <Eyebrow className="mt-3">{addedText(program.addedCount)}</Eyebrow>
      </Rise>

      <Rise className="px-gutter">
        <StatGrid
          items={[
            { label: 'тренировок', value: program.complexes.length },
            { label: pluralize(exercises, EXERCISE_FORMS, { withCount: false }), value: exercises },
          ]}
        />
      </Rise>

      <ComplexQueue
        complexes={program.complexes}
        activeId={program.complexes[0]?.id}
        aside="по кругу, с первого"
        action={(c, close) => <CopyComplexButton complexId={c.id} shareToken={shareToken} onDone={close} />}
      />

      {program.complexes.map((c, i) => (
        <ScreenSection
          key={c.id}
          title={`${complexLetter(i)} · ${c.name}`}
          aside={pluralize(
            c.exercises.reduce((sum, e) => sum + e.sets, 0),
            SET_FORMS,
          )}
        >
          <List>
            <ExerciseBlocks items={c.exercises}>
              {(e, j, label, last) => (
                // Вся строка открывает карточку упражнения
                <ListRow
                  key={e.id}
                  last={last}
                  // В суперсете строка внутри рамки: на всю ширину экрана подсветка её перекрыла бы
                  className={cn(!label && '-mx-gutter px-gutter')}
                  lead={label ?? String(j + 1).padStart(2, '0')}
                  title={e.name}
                  meta={e.muscles}
                  onPress={() => setOpened({ id: e.exerciseId, name: e.name })}
                  trail={
                    <Poster size="sm" numberOfLines={1}>
                      {planText(e.sets, e.repsMin, e.repsMax, e.measure)}
                    </Poster>
                  }
                />
              )}
            </ExerciseBlocks>
          </List>
        </ScreenSection>
      ))}

      <Rise className="px-gutter">
        <Text size="xs" tone="muted">
          После «Взять» копия становится твоей программой — её можно править. Нужна одна тренировка — открой её билет и
          скопируй в любую свою программу.
        </Text>
      </Rise>

      <ExerciseSheet
        exercise={opened}
        onOpenChange={(open) => !open && setOpened(null)}
        action={
          opened ? (
            <ButtonLink
              href={routeHref(ROUTES.EXERCISE, { exerciseId: opened.id })}
              variant="outline"
              size="lg"
              block
              onNavigate={() => setOpened(null)}
            >
              Подробнее в справочнике
            </ButtonLink>
          ) : undefined
        }
      />
    </>
  );
};

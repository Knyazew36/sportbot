import { useState } from 'react';
import { View } from 'react-native';
import { Pencil } from 'lucide-react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { isPublishable } from '@sportbot/api/entities/program';
import { useMakeNextComplex, useProgram } from '@/shared/local/entities/program';

import { PUBLICATION_STATUS } from '@/features/publish-program/publication-status';
import { PublishSheet } from '@/features/publish-program/PublishSheet';
import { ShowOthers } from '@/features/publish-program/ShowOthers';
import { routeHref, ROUTES } from '@/shared/config/routes';
import { EXERCISE_FORMS, SET_FORMS } from '@/shared/lib/plural-forms';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Rise } from '@/shared/ui/kit/Reveal';
import { StatGrid } from '@/shared/ui/kit/StatGrid';
import { StatusFromMeta } from '@/shared/ui/kit/StatusBadge';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';
import { ComplexQueue } from '@/widgets/complex-queue/ComplexQueue';

import { AddComplexTicket } from './AddComplexTicket';

export const ActiveProgram = ({ programId }: { programId: number }) => {
  const program = useProgram(programId);
  const [publishing, setPublishing] = useState(false);
  const makeNext = useMakeNextComplex();

  return (
    <QueryState query={program}>
      {(p) => {
        const exercises = p.complexes.reduce((sum, c) => sum + c.exercises.length, 0);
        const sets = p.complexes.reduce((sum, c) => sum + c.exercises.reduce((s, e) => s + e.sets, 0), 0);
        const publishable = isPublishable(p);

        return (
          <>
            <Rise className="px-gutter">
              <Eyebrow tone="positive">Активная программа</Eyebrow>
              <Poster size="3xl" tone="positive" className="mt-3">
                {p.name}
              </Poster>
              {publishable && p.publication !== 'DRAFT' && (
                <View className="mt-3">
                  <StatusFromMeta meta={PUBLICATION_STATUS[p.publication]} />
                </View>
              )}
              {p.fromFriend && (
                <Text tone="soft" className="mt-2">
                  от {p.fromFriend}
                </Text>
              )}
            </Rise>
            <ComplexQueue
              complexes={p.complexes}
              activeId={p.complexes.find((c) => c.isNext)?.id}
              aside={p.complexes.length > 0 ? 'следующая подсвечена' : undefined}
              onPick={(id) => makeNext.mutate(id)}
              pickLabel="Сделать следующей"
              trailing={<AddComplexTicket programId={p.id} count={p.complexes.length} />}
            />
            <Rise className="px-gutter gap-4">
              <StatGrid
                items={[
                  { label: 'тренировок', value: p.complexes.length },
                  { label: pluralize(exercises, EXERCISE_FORMS, { withCount: false }), value: exercises },
                  { label: pluralize(sets, SET_FORMS, { withCount: false }), value: sets },
                ]}
              />
              <ButtonLink
                href={routeHref(ROUTES.PROGRAM, { programId: p.id })}
                variant="outline"
                block
                icon={Pencil}
              >
                Редактировать
              </ButtonLink>
              <ShowOthers program={p} onPublish={() => setPublishing(true)} className="mt-2" />
            </Rise>
            {publishable && <PublishSheet program={p} open={publishing} onOpenChange={setPublishing} />}
          </>
        );
      }}
    </QueryState>
  );
};

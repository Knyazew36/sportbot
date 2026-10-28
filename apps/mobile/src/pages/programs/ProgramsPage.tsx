import { useState } from 'react';
import { Plus } from 'lucide-react-native';

import { usePrograms } from '@/shared/local/entities/program';

import { Button } from '@/shared/ui/kit/Button';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader';
import { Lead } from '@/shared/ui/kit/Typography';
import { MyPrograms } from '@/widgets/my-programs/MyPrograms';

import { ActiveProgram } from './components/ActiveProgram';
import { CatalogPicks } from './components/CatalogPicks';
import { NewProgramSheet } from './components/NewProgramSheet';
import { SourceUpdate } from './components/SourceUpdate';
import { MY_PROGRAMS_SHOWN } from './model/constants';

const ProgramsPage = () => {
  const programs = usePrograms();
  const [newOpen, setNewOpen] = useState(false);

  return (
    <Screen
      header={<ScreenHeader title="Программы" />}
      footer={
        <StickyFooter>
          <Button size="lg" iconRight={Plus} onPress={() => setNewOpen(true)}>
            Новая программа
          </Button>
        </StickyFooter>
      }
    >
      <QueryState query={programs}>
        {(list) => {
          if (!list.length) {
            return (
              <>
                <Rise className="px-gutter">
                  <Lead>Программ пока нет. Подбери готовую под себя или собери свою с нуля.</Lead>
                </Rise>
                <CatalogPicks title="Подобрать программу" />
              </>
            );
          }

          const active = list.find((p) => p.active);
          return (
            <>
              {active && <ActiveProgram programId={active.id} />}
              {list
                .filter((p) => p.sourceUpdated)
                .map((p) => (
                  <SourceUpdate key={p.id} program={p} />
                ))}
              <MyPrograms programs={list.filter((p) => !p.active)} title="Мои программы" limit={MY_PROGRAMS_SHOWN} />
              <CatalogPicks title="Другие программы" />
            </>
          );
        }}
      </QueryState>
      <NewProgramSheet open={newOpen} onOpenChange={setNewOpen} />
    </Screen>
  );
};

export default ProgramsPage;

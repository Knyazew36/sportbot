import { useState } from 'react';

import type { CatalogKind } from '@sportbot/api/entities/catalog';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { ExerciseCreateSheet } from '@/widgets/catalog/ExerciseCreateSheet';
import { NewEntryLinks } from '@/widgets/catalog/NewEntryLinks';
import { StretchCreateSheet } from '@/widgets/catalog/StretchCreateSheet';

import { MyEntries } from './components/MyEntries';

// «Мои» справочника (frontend-tz, 11.5): свои записи и заявки — вложенным экраном, чтобы «Назад» вёл в справочник
const MyEntriesPage = () => {
  const [creating, setCreating] = useState<CatalogKind | null>(null);

  return (
    <Screen
      fullscreen
      header={<TopBar title="Мои записи" />}
      footer={
        <StickyFooter>
          <NewEntryLinks onCreate={setCreating} />
        </StickyFooter>
      }
      className="gap-5 pt-4"
    >
      <MyEntries />
      <ExerciseCreateSheet open={creating === 'exercise'} onOpenChange={(open) => !open && setCreating(null)} />
      <StretchCreateSheet open={creating === 'stretch'} onOpenChange={(open) => !open && setCreating(null)} />
    </Screen>
  );
};

export default MyEntriesPage;

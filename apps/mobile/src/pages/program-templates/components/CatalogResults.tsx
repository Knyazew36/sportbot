import { View } from 'react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import type { Program } from '@sportbot/api/entities/program';

import { PROGRAM_FORMS } from '@/shared/lib/plural-forms';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography';
import { TemplateCard } from '@/widgets/program-templates/TemplateCard';

import type { CatalogSort } from '../model/use-catalog-filter';

type CatalogResultsProps = {
  list: Program[];
  sort: CatalogSort;
};

// С фильтром — один список результатов вместо полок витрины
export const CatalogResults = ({ list, sort }: CatalogResultsProps) => (
  <Rise className="px-gutter gap-5">
    <View className="flex-row items-baseline justify-between gap-3">
      <Poster size="lg">{sort === 'popular' ? 'Рейтинг' : 'Нашлось'}</Poster>
      <Eyebrow>{pluralize(list.length, PROGRAM_FORMS)}</Eyebrow>
    </View>
    {list.map((t) => (
      <TemplateCard key={t.id} template={t} />
    ))}
  </Rise>
);

import { ScrollView } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

import { useTemplates } from '@sportbot/api/entities/program';

import { ROUTES } from '@/shared/config/routes';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { TemplateTile } from '@/widgets/program-templates/TemplateTile';

import { CATALOG_PICKS } from '../model/constants';

export const CatalogPicks = ({ title }: { title: string }) => {
  const templates = useTemplates();
  const picks = templates.data?.filter((t) => t.takenProgramId == null).slice(0, CATALOG_PICKS) ?? [];
  if (!picks.length) return null;

  return (
    <ScreenSection
      title={title}
      bleed
      action={
        <ButtonLink
          href={ROUTES.PROGRAM_TEMPLATES}
          variant="link"
          size="sm"
          iconRight={ArrowRight}
          contentClassName="min-h-0 px-0 py-0"
        >
          Все
        </ButtonLink>
      }
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-gutter gap-2 pb-1">
        {picks.map((template) => (
          <TemplateTile key={template.id} template={template} />
        ))}
      </ScrollView>
    </ScreenSection>
  );
};

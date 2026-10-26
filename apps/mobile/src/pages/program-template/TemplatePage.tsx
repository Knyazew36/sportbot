import { router, useLocalSearchParams } from 'expo-router';

import { type CatalogSource, SOURCE_PARAM, useTakeTemplate, useTemplates } from '@sportbot/api/entities/program';

import { routeHref, ROUTES } from '@/shared/config/routes';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { ProgramDetails } from '@/widgets/program-details/ProgramDetails';
import { TakeFooter } from '@/widgets/program-details/TakeFooter';

// Шаблон или программа пользователя целиком: что за тренировки внутри, прежде чем брать себе (frontend-tz, 10.2).
// Отдельного запроса нет — каталог приходит списком с составом, таб берём из параметров
const TemplatePage = () => {
  const params = useLocalSearchParams<{ templateId: string; source?: string }>();
  const templateId = Number(params.templateId);
  const source: CatalogSource = params[SOURCE_PARAM] === 'users' ? 'users' : 'templates';
  const users = source === 'users';
  const templates = useTemplates({ source });
  const take = useTakeTemplate();
  const template = templates.data?.find((t) => t.id === templateId);

  return (
    <Screen
      fullscreen
      header={
        <TopBar
          title={template?.name ?? (users ? 'Программа' : 'Шаблон')}
          subtitle={users ? 'программа пользователя' : 'шаблон'}
        />
      }
      footer={
        template ? (
          <TakeFooter
            program={template}
            pending={take.isPending}
            onTake={() =>
              take.mutate(template.id, {
                onSuccess: (copy) => router.push(routeHref(ROUTES.PROGRAM, { programId: copy.id })),
              })
            }
          />
        ) : (
          <StickyFooter />
        )
      }
    >
      <QueryState
        query={templates}
        isEmpty={(list) => !list.some((t) => t.id === templateId)}
        empty={{
          title: users ? 'Программа не найдена' : 'Шаблон не найден',
          description: 'Возможно, его убрали из каталога.',
          action: (
            <ButtonLink
              href={routeHref(ROUTES.PROGRAM_TEMPLATES, { [SOURCE_PARAM]: users ? 'users' : undefined })}
              replace
              variant="outline"
            >
              В каталог
            </ButtonLink>
          ),
        }}
      >
        {(list) => <ProgramDetails program={list.find((x) => x.id === templateId)!} />}
      </QueryState>
    </Screen>
  );
};

export default TemplatePage;

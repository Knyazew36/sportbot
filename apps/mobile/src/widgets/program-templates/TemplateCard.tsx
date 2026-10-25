import { View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Plus } from 'lucide-react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { addedText, catalogSourceOf, type Program, useTakeTemplate } from '@sportbot/api/entities/program';

import { toAssetUrl } from '@/shared/api';
import { routeHref, ROUTES } from '@/shared/config/routes';
import { haptic } from '@/shared/lib/haptics';
import { EXERCISE_FORMS, WORKOUT_FORMS } from '@/shared/lib/plural-forms';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/kit/Badge';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';

import { catalogItemPath } from './catalog-item-path';
import { Pressable } from '@/shared/ui/kit/Pressable';

/** Тегов на карточке: остальные видно на экране программы */
const CARD_TAGS = 3;

/** Вырез корешка — полукруг цвета фона на линии отрыва */
const Notch = ({ className }: { className: string }) => (
  <View className={cn('bg-background border-foreground/80 absolute left-[73px] size-3 rounded-full border-[1.5px]', className)} />
);

// Программа каталога — билет, порт widgets/program-templates/TemplateCard.tsx: на корешке крупно, сколько комплексов
// в очереди, справа название, автор, теги и «Взять». Тап по билету открывает программу. Уже взятую — открывает свою копию:
// второй раз берут с экрана программы, а не случайным нажатием здесь. Свою программу не берут — её открывают
export const TemplateCard = ({ template: t }: { template: Program }) => {
  const take = useTakeTemplate();
  const exercises = t.complexes.reduce((sum, c) => sum + c.exercises.length, 0);
  const openId = t.mine ? t.id : t.takenProgramId;
  // Взятую не подписываем: и так видно по кнопке «Открыть» и бледной цифре на корешке
  const status = t.mine ? 'твоя' : null;
  // Слово без числа: число стоит на корешке плакатом
  const complexWord = pluralize(t.complexes.length, WORKOUT_FORMS).replace(/^\S+\s/, '');

  return (
    <Rise>
      <Pressable
        accessibilityRole="link"
        onPress={() => {
          haptic.tap();
          router.push(catalogItemPath(t.id, catalogSourceOf(t)));
        }}
        className="border-foreground/80 bg-card active:bg-accent flex-row border-[1.5px]"
      >
        <View className="border-foreground/40 w-20 shrink-0 items-center justify-center gap-1 border-r-[1.5px] border-dashed py-3">
          <Poster size="2xl" numeric tone={openId != null ? 'faint' : 'primary'}>
            {String(t.complexes.length)}
          </Poster>
          <Eyebrow size="sm" className="text-center tracking-normal">
            {complexWord}
          </Eyebrow>
        </View>
        <Notch className="-top-[7px]" />
        <Notch className="-bottom-[7px]" />

        <View className="min-w-0 flex-1 gap-2 p-3">
          <Poster size="md" numberOfLines={2}>
            {t.name}
          </Poster>
          {t.author && (
            <View className="flex-row items-center gap-2">
              <PersonAvatar name={t.author.name} src={toAssetUrl(t.author.avatarUrl)} size="xs" />
              <Text size="sm" tone="muted" numberOfLines={1} className="min-w-0 flex-1">
                {t.author.name}
              </Text>
            </View>
          )}
          {t.description ? (
            <Text size="sm" tone="soft" numberOfLines={5}>
              {t.description}
            </Text>
          ) : null}
          {/* Бейджи — только теги подбора; состав и «твоя» — подписью */}
          {t.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-1.5">
              {t.tags.slice(0, CARD_TAGS).map((tg) => (
                <Badge key={tg.id}>{tg.name}</Badge>
              ))}
            </View>
          )}
          <View className="mt-1 flex-row items-end justify-between gap-3">
            <Eyebrow className="min-w-0 shrink">
              {pluralize(exercises, EXERCISE_FORMS)}
              {t.addedCount > 0 && ` · ${addedText(t.addedCount)}`}
              {status && (
                <>
                  {' · '}
                  <Eyebrow tone="primary">{status}</Eyebrow>
                </>
              )}
            </Eyebrow>
            {openId != null ? (
              <ButtonLink
                href={routeHref(ROUTES.PROGRAM, { programId: openId })}
                variant="outline"
                size="sm"
                iconRight={ArrowRight}
                className="shrink-0"
              >
                Открыть
              </ButtonLink>
            ) : (
              <Button
                size="sm"
                icon={Plus}
                className="shrink-0"
                loading={take.isPending}
                onPress={() =>
                  take.mutate(t.id, {
                    onSuccess: (copy) => router.push(routeHref(ROUTES.PROGRAM, { programId: copy.id })),
                  })
                }
              >
                Взять
              </Button>
            )}
          </View>
        </View>
      </Pressable>
    </Rise>
  );
};

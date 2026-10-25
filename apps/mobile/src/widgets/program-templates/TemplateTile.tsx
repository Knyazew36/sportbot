import { View } from 'react-native';
import { router } from 'expo-router';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { addedText, catalogSourceOf, type Program } from '@sportbot/api/entities/program';

import { toAssetUrl } from '@/shared/api';
import { haptic } from '@/shared/lib/haptics';
import { WORKOUT_FORMS } from '@/shared/lib/plural-forms';
import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Badge } from '@/shared/ui/kit/Badge';
import { Halftone } from '@/shared/ui/kit/Patterns';
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';

import { catalogItemPath } from './catalog-item-path';
import { Pressable } from '@/shared/ui/kit/Pressable';

// Плитка горизонтальной ленты — порт widgets/program-templates/TemplateTile.tsx: «От сообщества», подборка на экране
// программ. Автор — сверху, как подпись под афишей. Жёсткая тень, как у кнопок и билетов, — «сюда можно тыкать».
// Только открыть — брать решают на экране программы, посмотрев состав
export const TemplateTile = ({ template: t }: { template: Program }) => {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => {
        haptic.tap();
        router.push(catalogItemPath(t.id, catalogSourceOf(t)));
      }}
      className="w-60 shrink-0 pr-[3px] pb-[3px]"
    >
      {({ pressed }) => (
        <View className="flex-1">
          <View className="bg-sb-ink absolute inset-0 translate-x-[3px] translate-y-[3px]" />
          <View
            className={cn(
              'border-foreground bg-card flex-1 gap-2.5 overflow-hidden border-[1.5px] p-3',
              pressed && 'translate-x-[3px] translate-y-[3px]',
            )}
          >
            {/* Растровый угол — фирменная фактура плаката */}
            <View pointerEvents="none" className="absolute -top-2 -right-2 size-20 opacity-40">
              <Halftone color={colors.ink} />
            </View>
            {t.author && (
              <View className="flex-row items-center gap-2">
                <PersonAvatar name={t.author.name} src={toAssetUrl(t.author.avatarUrl)} size="sm" />
                <Text size="sm" tone="muted" numberOfLines={1} className="min-w-0 flex-1">
                  {t.author.name}
                </Text>
              </View>
            )}
            <Poster size="md" numberOfLines={2}>
              {t.name}
            </Poster>
            {t.description ? (
              <Text size="sm" tone="soft" numberOfLines={3}>
                {t.description}
              </Text>
            ) : null}
            <View className="mt-auto flex-row flex-wrap gap-1.5">
              {t.tags.slice(0, 3).map((tg) => (
                <Badge key={tg.id}>{tg.name}</Badge>
              ))}
            </View>
            <Eyebrow>
              {pluralize(t.complexes.length, WORKOUT_FORMS)}
              {t.addedCount > 0 && ` · ${addedText(t.addedCount)}`}
            </Eyebrow>
          </View>
        </View>
      )}
    </Pressable>
  );
};

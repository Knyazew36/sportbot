import { useState } from 'react';
import { View } from 'react-native';
import { ImageOff } from 'lucide-react-native';

import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { Icon } from './Icon';
import { Image } from './Image';
import { Halftone } from './Patterns';
import { Eyebrow } from './Typography';

type CatalogImageProps = {
  src: string | null;
  alt: string;
  /** Миниатюра в списке или крупная картинка карточки */
  size?: 'thumb' | 'cover';
  emptyLabel?: string;
};

// Картинка упражнения или растяжки — порт shared/ui/kit/CatalogImage.tsx (expo-image кэширует на диск).
// У черновиков и части записей картинки нет — тогда растровая заглушка, а не пустое место
export const CatalogImage = ({ src, alt, size = 'thumb', emptyLabel = 'картинку добавит админ' }: CatalogImageProps) => {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  // TODO временный лог: разбор пропавших картинок на телефоне
  if (__DEV__ && !src) console.warn('[CatalogImage] src пустой', alt);

  return (
    <View
      className={cn(
        'border-foreground/80 overflow-hidden border-[1.5px] bg-white',
        size === 'thumb' ? 'size-14' : 'aspect-[4/3] w-full',
      )}
    >
      {src && !failed ? (
        <Image
          source={src}
          accessibilityLabel={alt}
          contentFit="cover"
          transition={150}
          className="size-full"
          onError={(e) => {
            // TODO временный лог: разбор пропавших картинок на телефоне
            if (__DEV__) console.warn('[CatalogImage] ошибка загрузки', src, e.error);
            setFailed(true);
          }}
        />
      ) : (
        <View className="bg-background flex-1 items-center justify-center">
          <Halftone color={colors.blue} opacity={0.25} />
          <View className="bg-background flex-row items-center gap-1.5 px-1.5 py-1">
            <Icon as={ImageOff} className={cn('text-foreground/45', size === 'thumb' ? 'size-4' : 'size-5')} />
            {size === 'cover' && (
              <Eyebrow tone="inherit" className="text-foreground/45">
                {emptyLabel}
              </Eyebrow>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

type PhotoPairProps = {
  start: string | null;
  /** Финишное положение; нет — одна крупная картинка */
  end: string | null;
  alt: string;
};

// Старт и финиш рядом, чтобы движение читалось без видео — порт PhotoPair.tsx.
// Полноэкранная галерея — этап 2 (справочник)
export const PhotoPair = ({ start, end, alt }: PhotoPairProps) => {
  if (!end) return <CatalogImage src={start} alt={alt} size="cover" />;
  return (
    <View className="flex-row gap-2">
      {[
        { src: start, label: 'Старт' },
        { src: end, label: 'Финиш' },
      ].map((slot) => (
        <View key={slot.label} className="flex-1 gap-1">
          <CatalogImage src={slot.src} alt={`${alt}: ${slot.label.toLowerCase()}`} size="cover" />
          <Eyebrow>{slot.label}</Eyebrow>
        </View>
      ))}
    </View>
  );
};

import { useState } from 'react';
import { View } from 'react-native';

import { cn } from '@/shared/lib/utils';

import { Image } from './Image';
import { Text } from './Typography';

type Size = 'xs' | 'sm' | 'default' | 'lg' | 'xl';

type PersonAvatarProps = {
  name: string;
  src?: string;
  size?: Size;
  // inverse — для карточек на чёрном; accent — выделить текущего пользователя mint-кружком
  tone?: 'default' | 'inverse' | 'accent';
  className?: string;
};

const SIZE: Record<Size, { box: string; text: string }> = {
  xs: { box: 'size-6', text: 'text-[10px] leading-[12px]' },
  sm: { box: 'size-8', text: 'text-[12px] leading-[14px]' },
  default: { box: 'size-10', text: 'text-[14px] leading-[17px]' },
  lg: { box: 'size-12', text: 'text-[16px] leading-[19px]' },
  xl: { box: 'size-20', text: 'text-[28px] leading-[34px]' },
};

const TONE = {
  default: { bg: 'bg-mist', text: 'text-foreground' },
  inverse: { bg: 'bg-background/15', text: 'text-background' },
  accent: { bg: 'bg-success', text: 'text-black' },
} as const;

// Имя и фамилия — по первой букве; одно слово — две первые буквы («Серёжа» → «СЕ»)
export const initials = (name: string) => {
  const words = name.split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words.slice(0, 2).map((word) => word[0]).join('') : (words[0]?.slice(0, 2) ?? '');
  return letters.toUpperCase();
};

// Аватар человека — порт shared/ui/kit/PersonAvatar.tsx. Без фото — инициалы на монохромной подложке:
// цветом людей не различаем, акцент только у «я»
export const PersonAvatar = ({ name, src, size = 'default', tone = 'default', className }: PersonAvatarProps) => {
  const [failed, setFailed] = useState(false);
  const s = SIZE[size];
  const t = TONE[tone];

  return (
    <View className={cn('items-center justify-center overflow-hidden rounded-full', s.box, t.bg, className)}>
      {src && !failed ? (
        <Image source={src} accessibilityLabel={name} className="size-full" onError={() => setFailed(true)} />
      ) : (
        <Text medium className={cn(s.text, t.text)}>
          {initials(name)}
        </Text>
      )}
    </View>
  );
};

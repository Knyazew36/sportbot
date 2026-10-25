import { createContext, useContext } from 'react';
import {
  StyleSheet,
  Text as RNText,
  View,
  type StyleProp,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';

import { cn } from '@/shared/lib/utils';

// Типографика Спортбота — порт shared/ui/kit/Typography.tsx. Четыре голоса:
//   Poster  — плакатный кондензированный: заголовки и цифры
//   Lead    — волосяная антиква-курсив: вводная строка перед плакатом
//   Eyebrow — метка капсом с разрядкой: заголовок секции, подпись над значением
//   Text    — основной гротеск: абзацы, строки списков, пояснения
// На страницах выбирают size и tone, а не подбирают классы; className — для раскладки.
// Кегль, межстрочный и разрядка — в px: в RN нет относительных единиц для line-height и letter-spacing

/**
 * Цвет текста от контейнера — как TextClassContext в React Native Reusables.
 * В RN цвет не наследуется через View: чёрная плашка и кнопка кладут сюда свой цвет, tone="inherit" его берёт
 */
export const TextClassContext = createContext<string | undefined>(undefined);

const TONE = {
  default: 'text-foreground',
  primary: 'text-primary',
  /** «Активно, в работе»: активная программа */
  positive: 'text-positive',
  /** Вторичный текст: подписи, пояснения, мета */
  muted: 'text-muted-foreground',
  /** Слегка приглушённый текст абзацев */
  soft: 'text-foreground/80',
  /** Фоновая цифра или буква: номер комплекса, неактивный билет */
  faint: 'text-foreground/35',
  danger: 'text-destructive',
  /** На чёрной плашке InkPanel */
  inverse: 'text-background',
  inverseMuted: 'text-background/60',
  /** Цвет у контейнера (TextClassContext), иначе обычный. По умолчанию у Poster, Lead и Text */
  inherit: '',
} as const;

export type Tone = keyof typeof TONE;

type BaseProps = RNTextProps & { tone?: Tone; className?: string };

const useToneClass = (tone: Tone) => {
  const inherited = useContext(TextClassContext);
  return cn('text-foreground', inherited, TONE[tone]);
};

// ── Poster ──────────────────────────────────────────────────────────────────

// Шкала с шагом ~1.25. Межстрочный привязан к кеглю: плакатные 0.86 хороши для крупных слов,
// а мелкие строки при таком интервале слипаются с подписью под ними
const POSTER_SIZE = {
  xs: 'text-[16px] leading-[17.6px]',
  sm: 'text-[20px] leading-[22px]',
  md: 'text-[24px] leading-[25.2px]',
  lg: 'text-[28px] leading-[28px] tracking-[-0.56px]',
  xl: 'text-[34px] leading-[32.3px] tracking-[-0.68px]',
  '2xl': 'text-[44px] leading-[39.6px] tracking-[-0.88px]',
  '3xl': 'text-[56px] leading-[49.3px] tracking-[-1.12px]',
  '4xl': 'text-[72px] leading-[62px] tracking-[-1.44px]',
  '5xl': 'text-[88px] leading-[75.7px] tracking-[-1.76px]',
  display: 'text-[104px] leading-[89.4px] tracking-[-2.08px]',
  hero: 'text-[128px] leading-[110px] tracking-[-2.56px]',
} as const;

const POSTER_FONT_SIZE: Record<PosterSize, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 34,
  '2xl': 44,
  '3xl': 56,
  '4xl': 72,
  '5xl': 88,
  display: 104,
  hero: 128,
};

export type PosterSize = keyof typeof POSTER_SIZE;

type PosterProps = BaseProps & {
  size?: PosterSize;
  /** Цифры: равная ширина знаков — таймеры, веса */
  numeric?: boolean;
  /** Ужать кегль, пока строка не влезет в ширину — fit фронта */
  fit?: boolean;
};

// Равноширокие цифры: у Oswald нет табличных цифр, поэтому каждая — в ячейке своей ширины.
// Внутри Text ширина вложенного Text не действует — для тикающего времени нужен Clock
export const Digits = ({ children, fontSize }: { children: string; fontSize: number }) => (
  <>
    {children.split(/(\d)/).map((part, i) =>
      /\d/.test(part) ? (
        <RNText key={i} style={{ width: 0.56 * fontSize, textAlign: 'center' }}>
          {part}
        </RNText>
      ) : (
        part
      ),
    )}
  </>
);

export const Poster = ({ size = 'md', tone = 'inherit', numeric, fit, className, children, ...props }: PosterProps) => (
  <RNText
    numberOfLines={fit ? 1 : undefined}
    adjustsFontSizeToFit={fit}
    {...props}
    className={cn('font-display uppercase', POSTER_SIZE[size], useToneClass(tone), className)}
  >
    {typeof children === 'string' && numeric ? <Digits fontSize={POSTER_FONT_SIZE[size]}>{children}</Digits> : children}
  </RNText>
);

type ClockProps = {
  size?: PosterSize;
  tone?: Tone;
  /** Кегль, если он задан через style, а не размером шкалы: ширина ячейки считается от него */
  fontSize?: number;
  style?: StyleProp<TextStyle>;
  /** Раскладка и прозрачность строки целиком */
  className?: string;
  children: string;
};

// Идущее время плакатным шрифтом: каждая цифра — отдельный Text в строке View. Только так ячейка
// держит ширину — у вложенного Text в RN её нет, и время дёргалось бы каждую секунду («1» уже «0»).
// Межстрочный не задаём: у Oswald высокие выносные, и любой lineHeight меньше родной высоты шрифта
// Android срезает снизу. Плакатный leading из класса и style поэтому сюда не берём — только кегль
export const Clock = ({ size = 'hero', tone = 'inherit', fontSize, style, className, children }: ClockProps) => {
  const text = cn('font-display uppercase', useToneClass(tone));
  const font = fontSize ?? POSTER_FONT_SIZE[size];
  const { lineHeight: _leading, ...rest } = StyleSheet.flatten(style) ?? {};
  const glyph = [rest, { fontSize: font, includeFontPadding: false }];
  return (
    <View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={children}
      className={cn('flex-row items-center', className)}
    >
      {children
        .split(/(\d)/)
        .filter(Boolean)
        .map((part, i) => (
          <RNText
            key={i}
            className={text}
            style={[...glyph, /\d/.test(part) && { width: 0.56 * font, textAlign: 'center' }]}
          >
            {part}
          </RNText>
        ))}
    </View>
  );
};

/** Единица измерения рядом с плакатной цифрой: «кг», «раз», «с». Цвет — от родителя */
export const Unit = ({ className, ...props }: RNTextProps & { className?: string }) => (
  <RNText {...props} className={cn('font-sans text-[10px] normal-case tracking-normal opacity-50', className)} />
);

/** Знак при плакатной цифре тем же шрифтом, но мельче: «%» */
export const Suffix = ({ className, ...props }: RNTextProps & { className?: string }) => (
  <RNText {...props} className={cn('text-[10px]', className)} />
);

// ── Lead ────────────────────────────────────────────────────────────────────

const LEAD_SIZE = {
  sm: 'text-[22px] leading-[23.1px] tracking-[-0.44px]',
  md: 'text-[26px] leading-[27.3px] tracking-[-0.52px]',
  lg: 'text-[34px] leading-[35.7px] tracking-[-0.68px]',
  xl: 'text-[40px] leading-[42px] tracking-[-0.8px]',
} as const;

type LeadProps = BaseProps & { size?: keyof typeof LEAD_SIZE };

// Вводная строка перед плакатным заголовком: «сегодня на очереди —»
export const Lead = ({ size = 'lg', tone = 'inherit', className, ...props }: LeadProps) => (
  <RNText {...props} className={cn('font-serif', LEAD_SIZE[size], useToneClass(tone), className)} />
);

// ── Eyebrow ─────────────────────────────────────────────────────────────────

const EYEBROW_SIZE = {
  sm: 'text-[10.5px] leading-[13px] tracking-[1.47px]',
  md: 'text-[11px] leading-[13.75px] tracking-[1.54px]',
} as const;

type EyebrowProps = BaseProps & { size?: keyof typeof EYEBROW_SIZE };

// Метка над значением или заголовок секции: капс с разрядкой вместо жирности
export const Eyebrow = ({ size = 'md', tone = 'muted', className, ...props }: EyebrowProps) => (
  <RNText {...props} className={cn('font-sans uppercase', EYEBROW_SIZE[size], useToneClass(tone), className)} />
);

// ── Text ────────────────────────────────────────────────────────────────────

const TEXT_SIZE = {
  '2xs': 'text-[12px] leading-[15.6px] tracking-[-0.24px]',
  xs: 'text-[13px] leading-[16.9px] tracking-[-0.26px]',
  sm: 'text-[14px] leading-[18.2px] tracking-[-0.28px]',
  md: 'text-[15px] leading-[18.75px] tracking-[-0.3px]',
  lg: 'text-[16px] leading-[20px] tracking-[-0.32px]',
} as const;

type TextProps = BaseProps & {
  size?: keyof typeof TEXT_SIZE;
  /** Полужирное начертание Onest 500 — у загруженного шрифта веса через font-weight в RN нет */
  medium?: boolean;
};

// Основной текст: абзацы, названия строк, пояснения
export const Text = ({ size = 'md', tone = 'inherit', medium, className, ...props }: TextProps) => (
  <RNText
    {...props}
    className={cn(medium ? 'font-sans-medium' : 'font-sans', TEXT_SIZE[size], useToneClass(tone), className)}
  />
);

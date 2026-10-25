import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { fonts } from '@/shared/theme/fonts';
import { useTheme } from '@/shared/theme/ThemeProvider';

// Типографика Спортбота — порт shared/ui/kit/Typography.tsx.
// Четыре голоса: Poster (плакат), Lead (антиква-курсив), Eyebrow (метка капсом), Text (гротеск).
// На страницах выбирают size и tone, а не подбирают стили.

export type Tone =
  | 'default'
  | 'primary'
  | 'positive'
  | 'muted'
  | 'soft'
  | 'faint'
  | 'danger'
  | 'inverse'
  | 'inverseMuted'
  | 'inherit';

const useToneColor = (tone: Tone): string | undefined => {
  const { colors } = useTheme();
  switch (tone) {
    case 'default':
      return colors.ink;
    case 'primary':
      return colors.blue;
    case 'positive':
      return colors.positive;
    case 'muted':
      return colors.slate;
    case 'soft':
      return colors.graphite;
    case 'faint':
      return colors.smoke;
    case 'danger':
      return colors.danger;
    case 'inverse':
      return colors.paper;
    case 'inverseMuted':
      return colors.hatch;
    case 'inherit':
      return undefined;
  }
};

type BaseProps = RNTextProps & {
  tone?: Tone;
};

// ── Poster ──────────────────────────────────────────────────────────────────

const POSTER_SIZE = {
  xs: { fontSize: 16, lineHeight: 17.6 },
  sm: { fontSize: 20, lineHeight: 22 },
  md: { fontSize: 24, lineHeight: 25.2 },
  lg: { fontSize: 28, lineHeight: 28 },
  xl: { fontSize: 34, lineHeight: 32.3 },
  '2xl': { fontSize: 44, lineHeight: 39.6 },
  '3xl': { fontSize: 56, lineHeight: 49.3 },
  '4xl': { fontSize: 72, lineHeight: 62 },
  '5xl': { fontSize: 88, lineHeight: 75.7 },
  display: { fontSize: 104, lineHeight: 89.4 },
  hero: { fontSize: 128, lineHeight: 110 },
} as const;

export type PosterSize = keyof typeof POSTER_SIZE;

type PosterProps = BaseProps & {
  size?: PosterSize;
  /** Одна строка с многоточием */
  numberOfLines?: number;
  /** Цифры: равная ширина знаков — таймеры, веса */
  numeric?: boolean;
};

// Равноширокие цифры: Oswald не имеет табличных цифр, поэтому каждая — в ячейке.
// Разбивает строку посимвольно, сохраняя общий стиль
export const Digits = ({ children, style }: { children: string; style?: TextStyle }) => {
  const parts = children.split(/(\d)/);
  return (
    <RNText style={style}>
      {parts.map((part, i) =>
        /\d/.test(part) ? (
          <RNText key={i} style={{ width: 0.56 * ((style?.fontSize as number) ?? 24), textAlign: 'center' }}>
            {part}
          </RNText>
        ) : (
          <RNText key={i}>{part}</RNText>
        ),
      )}
    </RNText>
  );
};

export const Poster = ({ size = 'md', tone = 'inherit', numeric, style, children, ...props }: PosterProps) => {
  const color = useToneColor(tone);
  const s = POSTER_SIZE[size];
  return (
    <RNText
      {...props}
      style={[
        {
          fontFamily: fonts.display,
          fontSize: s.fontSize,
          lineHeight: numeric ? s.fontSize * 0.82 : s.lineHeight,
          letterSpacing: -0.02,
          textTransform: 'uppercase',
          color,
        },
        style,
      ]}
    >
      {typeof children === 'string' && numeric ? <Digits style={{}}>{children}</Digits> : children}
    </RNText>
  );
};

/** Единица измерения рядом с плакатной цифрой: «кг», «раз», «с» */
export const Unit = (props: RNTextProps) => (
  <RNText
    {...props}
    style={[{ fontFamily: fonts.sans, fontSize: 10, letterSpacing: 0, opacity: 0.5, textTransform: 'none' }, props.style]}
  />
);

/** Знак при плакатной цифре тем же шрифтом, но мельче: «%» */
export const Suffix = (props: RNTextProps) => <RNText {...props} style={[{ fontSize: 10 }, props.style]} />;

// ── Lead ────────────────────────────────────────────────────────────────────

const LEAD_SIZE = {
  sm: { fontSize: 22, lineHeight: 23.1 },
  md: { fontSize: 26, lineHeight: 27.3 },
  lg: { fontSize: 34, lineHeight: 35.7 },
  xl: { fontSize: 40, lineHeight: 42 },
} as const;

type LeadProps = BaseProps & { size?: keyof typeof LEAD_SIZE };

// Вводная строка перед плакатным заголовком: «сегодня на очереди —»
export const Lead = ({ size = 'lg', tone = 'inherit', style, ...props }: LeadProps) => {
  const color = useToneColor(tone);
  const s = LEAD_SIZE[size];
  return (
    <RNText
      {...props}
      style={[{ fontFamily: fonts.serif, fontSize: s.fontSize, lineHeight: s.lineHeight, letterSpacing: -0.02, color }, style]}
    />
  );
};

// ── Eyebrow ─────────────────────────────────────────────────────────────────

const EYEBROW_SIZE = {
  sm: 10.5,
  md: 11,
} as const;

type EyebrowProps = BaseProps & { size?: keyof typeof EYEBROW_SIZE };

// Метка над значением или заголовок секции: капс с разрядкой вместо жирности
export const Eyebrow = ({ size = 'md', tone = 'muted', style, ...props }: EyebrowProps) => {
  const color = useToneColor(tone);
  return (
    <RNText
      {...props}
      style={[
        {
          fontFamily: fonts.sans,
          fontSize: EYEBROW_SIZE[size],
          lineHeight: EYEBROW_SIZE[size] * 1.25,
          letterSpacing: 0.14 * EYEBROW_SIZE[size],
          textTransform: 'uppercase',
          color,
        },
        style,
      ]}
    />
  );
};

// ── Text ────────────────────────────────────────────────────────────────────

const TEXT_SIZE = {
  '2xs': { fontSize: 12, lineHeight: 15.6 },
  xs: { fontSize: 13, lineHeight: 16.9 },
  sm: { fontSize: 14, lineHeight: 18.2 },
  md: { fontSize: 15, lineHeight: 18.75 },
  lg: { fontSize: 16, lineHeight: 20 },
} as const;

type TextProps = BaseProps & { size?: keyof typeof TEXT_SIZE };

// Основной текст: абзацы, названия строк, пояснения
export const Text = ({ size = 'md', tone = 'inherit', style, ...props }: TextProps) => {
  const color = useToneColor(tone);
  const s = TEXT_SIZE[size];
  return (
    <RNText
      {...props}
      style={[{ fontFamily: fonts.sans, fontSize: s.fontSize, lineHeight: s.lineHeight, letterSpacing: -0.02, color }, style]}
    />
  );
};

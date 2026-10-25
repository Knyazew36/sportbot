import re
import sys

src_path, dst_path = sys.argv[1], sys.argv[2]
s = open(src_path, encoding='utf-8').read()

# Импорты
s = re.sub(r"^import .*\n", "", s, flags=re.M)

# Кеттлбелл: вес по палитре — одна надпись вместо двух, переключаемых CSS
s = re.sub(
    r"<text\s+y='26'\s+className='sb-kb-classic'\s*>\s*32 кг\s*</text>\s*<text\s+y='26'\s+className='sb-kb-rose'\s*>\s*16 кг\s*</text>",
    "<text y='26'>{palette === 'rose' ? '16 кг' : '32 кг'}</text>",
    s,
)
s = s.replace("{/* Выдавленный вес зависит от палитры: синяя — 32 кг, розовая — 16 кг. Видимую надпись выбирает CSS */}",
              "{/* Выдавленный вес зависит от палитры: синяя — 32 кг, розовая — 16 кг */}")

# Анимации CSS: классы и inline-стили с transformOrigin/animation — в RN не работают, сцены статичны
s = re.sub(r"\n\s*className='[^']*'", "", s)
s = re.sub(r"\n\s*style=\{\{.*?\}\}", "", s)
s = re.sub(r" className='[^']*'", "", s)
s = re.sub(r"\n\s*aria-hidden", "", s)

# Корень сцены: ширина по родителю, высота по пропорции viewBox
def svg_root(m):
    w, h = m.group(1), m.group(2)
    return f"<Svg\n      viewBox='0 0 {w} {h}'\n      style={{[{{ width: '100%', aspectRatio: {w} / {h} }}, style]}}"
s = re.sub(r"<svg\s+viewBox='0 0 (\d+) (\d+)'\s+className=\{cn\([^)]*\)\}", svg_root, s)
assert 'className={cn' not in s, 'не все корни svg разобраны'

s = s.replace("({ className }: { className?: string })", "({ className }: ArtProps)")
s = s.replace("({ children, className }: { children?: ReactNode; className?: string })", "({ children }: { children?: ReactNode })")
s = s.replace("<g className={className}>", "<g>")

# Корень сцены обёрнут во View с className — закрываем обёртку после корневого </svg>
s = s.replace("    </svg>
  )
}", "    </svg>
    </View>
  )
}")

# Теги
TAGS = {
    'svg': 'Svg', 'circle': 'Circle', 'rect': 'Rect', 'path': 'Path', 'line': 'Line', 'g': 'G',
    'defs': 'Defs', 'pattern': 'Pattern', 'clipPath': 'ClipPath', 'text': 'SvgText', 'ellipse': 'Ellipse',
}
for tag, comp in TAGS.items():
    s = re.sub(rf"<{tag}(?=[\s>/])", f"<{comp}", s)
    s = re.sub(rf"</{tag}>", f"</{comp}>", s)

# Цвета темы и шрифт
# Внутри выражения {…} кавычки — просто значение, в атрибуте — {значение}
s = re.sub(r"(\? |: )'var\(--sb-(blue|ink|paper)\)'", lambda m: "%sc.%s" % (m.group(1), m.group(2)), s)
s = re.sub(r"'var\(--sb-(blue|ink|paper)\)'", lambda m: "{c.%s}" % m.group(1), s)
s = s.replace("'var(--font-display)'", "{fonts.display}")
assert 'var(--' not in s, 'остались CSS-переменные'

# useId даёт «:r0:» — в url(#…) react-native-svg двоеточия не переварит
s = s.replace("useId()", "useSvgId()")

# Каждой функции-компоненту — цвета темы. Сокращённое тело «=> (» разворачиваем в блок
lines = s.split('\n')
out = []
i = 0
comp_re = re.compile(r"^(export )?const [A-Z]\w* = \(.*\) => ([({])$")
while i < len(lines):
    line = lines[i]
    m = comp_re.match(line)
    if not m:
        out.append(line)
        i += 1
        continue
    hook = "  const { colors: c, palette } = useTheme()"
    if m.group(2) == '{':
        out.append(line)
        out.append(hook)
        i += 1
        continue
    # «=> (» … «)» на нулевом отступе
    out.append(line[:-1] + '{')
    out.append(hook)
    out.append('  return (')
    i += 1
    while lines[i] != ')':
        out.append('  ' + lines[i] if lines[i] else lines[i])
        i += 1
    out.append('  )')
    out.append('}')
    i += 1
s = '\n'.join(out)

header = """import { useId, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Pattern, Rect, Text as SvgText } from 'react-native-svg';

import { cn } from '@/shared/lib/utils';
import { fonts } from '@/shared/theme/fonts';
import { useTheme } from '@/shared/theme/ThemeProvider';

// СГЕНЕРИРОВАНО из apps/frontend/src/shared/ui/kit/Art.tsx скриптом конвертации (svg → react-native-svg).
// Правки сцен вносим во фронт и перегоняем. Отличия: цвета из темы вместо CSS-переменных,
// CSS-анимации (дыхание, маятник, мерцание) сняты — в RN сцены статичны

// Раскладка снаружи (отступы, ширина) — classNames на обёртке; сама сцена тянется по ширине с пропорцией viewBox
type ArtProps = { className?: string };

// useId в React 19 даёт ««r0»» — в url(#…) react-native-svg такие символы не переварит
const useSvgId = () => useId().replace(/[^a-zA-Z0-9]/g, '');
"""
s = s.replace("const { colors: c, palette } = useTheme()", "const { colors: c } = useTheme()")
s = s.replace(
    "export const Kettlebell = ({ children }: { children?: ReactNode }) => {
  const { colors: c } = useTheme()",
    "export const Kettlebell = ({ children }: { children?: ReactNode }) => {
  const { colors: c, palette } = useTheme()",
)
s = s.replace("{CONFETTI.map(({ x, y, ink, delay, duration }) => (", "{CONFETTI.map(({ x, y, ink }) => (")
s = header + s
open(dst_path, 'w', encoding='utf-8').write(s)
print('ok', len(s.split('\n')))

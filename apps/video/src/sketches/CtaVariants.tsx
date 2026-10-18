// Набросок вариантов «плашка ведёт в приложение». Временный: только кадры для сравнения
import { LowerThirdCard } from '../../../../packages/video/src/cards/LowerThirdCard'
import { color, dark, font } from '../../../../packages/video/src/tokens'
import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill } from 'remotion'

const W = 1080
const H = 1920
const BOT = '@sportbot'
const TITLE = 'Жим гантелей лёжа'
const SUB = '4 подхода × 10 повторов'
const line = 6
const lift = 18

const Logo = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" style={{ display: 'block', flex: 'none' }}>
    <rect x="94" y="94" width="350" height="350" fill={color.ink} />
    <rect x="70" y="70" width="350" height="350" fill={color.mint} stroke={color.ink} strokeWidth="12" />
    <path d="M196 168L326 245L196 322Z" fill={color.ink} />
  </svg>
)

const Chip = ({ children, fill = color.paper, style }: { children: ReactNode; fill?: string; style?: CSSProperties }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 16,
      background: fill,
      border: `${line}px solid ${color.ink}`,
      boxShadow: `${lift * 0.6}px ${lift * 0.6}px 0 ${color.ink}`,
      padding: '12px 26px 12px 16px',
      fontFamily: font.sans,
      fontWeight: 600,
      fontSize: 38,
      color: color.ink,
      ...style,
    }}
  >
    {children}
  </div>
)

// Фон «чужого видео» + зона интерфейса Instagram, чтобы видеть, где плашка живёт
const Scene = ({ children, label }: { children: ReactNode; label: string }) => (
  <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 35%, #4a4f5c 0%, #23262e 55%, #121318 100%)' }}>
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 520,
        translate: '-50% 0',
        width: 420,
        height: 620,
        borderRadius: '210px 210px 60px 60px',
        background: 'rgba(255,255,255,0.06)',
      }}
    />
    {/* Интерфейс Instagram: подпись снизу, кнопки справа */}
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 250,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
      }}
    />
    <div style={{ position: 'absolute', left: 48, bottom: 70, fontFamily: font.sans, color: '#fff', fontSize: 30, opacity: 0.85 }}>
      <b>trainer_anna</b> · Подписаться
      <div style={{ fontSize: 28, opacity: 0.8, marginTop: 8 }}>Жим лёжа: техника без боли в плече…</div>
    </div>
    <div style={{ position: 'absolute', right: 34, bottom: 120, display: 'flex', flexDirection: 'column', gap: 46 }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ width: 62, height: 62, borderRadius: 31, border: '5px solid rgba(255,255,255,0.85)' }} />
      ))}
    </div>
    {children}
    <div
      style={{
        position: 'absolute',
        top: 60,
        left: 48,
        fontFamily: font.display,
        fontSize: 64,
        fontWeight: 600,
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}
    >
      {label}
    </div>
  </AbsoluteFill>
)

const At = ({ children, bottom = H * 0.22 }: { children: ReactNode; bottom?: number }) => (
  <div style={{ position: 'absolute', left: W * 0.06, bottom, maxWidth: W * 0.82 }}>{children}</div>
)

const Card = ({ fill = 'mint' as const }: { fill?: 'mint' | 'rest' | 'blue' | 'rose' }) => (
  <LowerThirdCard title={TITLE} subtitle={SUB} fill={fill} unit={W} />
)

// 1а. Ярлык бренда отдельным чипом под плашкой
export const BadgeChip = () => (
  <Scene label="1а · ярлык под плашкой">
    <At>
      <Card />
      <Chip style={{ marginTop: 28, fontSize: 32 }}>
        <Logo size={48} />
        Сделано в {BOT}
      </Chip>
    </At>
  </Scene>
)

// 1б. Ярлык вшит в плашку полосой снизу
export const BadgeStrip = () => (
  <Scene label="1б · полоса в плашке">
    <At>
      <div
        style={{
          background: color.mint,
          border: `${line}px solid ${color.ink}`,
          boxShadow: `${lift}px ${lift}px 0 ${color.ink}`,
        }}
      >
        <div style={{ padding: `${W * 0.026}px ${W * 0.034}px` }}>
          <div style={{ fontFamily: font.sans, fontWeight: 600, fontSize: W * 0.05, lineHeight: 1.15 }}>{TITLE}</div>
          <div style={{ fontFamily: font.sans, fontSize: W * 0.034, marginTop: W * 0.01, opacity: 0.7 }}>{SUB}</div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: color.ink,
            color: color.mint,
            padding: `12px ${W * 0.034}px`,
            fontFamily: font.sans,
            fontWeight: 600,
            fontSize: 30,
          }}
        >
          ▶ Программа целиком — {BOT} в Telegram
        </div>
      </div>
    </At>
  </Scene>
)

// 1в. Только логотип в углу плашки — минимально, без текста
export const BadgeCorner = () => (
  <Scene label="1в · логотип на плашке">
    <At>
      <div style={{ position: 'relative' }}>
        <Card />
        <div style={{ position: 'absolute', top: -64, right: -64 }}>
          <Logo size={96} />
        </div>
      </div>
    </At>
  </Scene>
)

// 4. Кодовое слово
export const Keyword = () => (
  <Scene label="4 · кодовое слово">
    <At>
      <Card />
      <Chip
        fill={color.voltage}
        style={{ marginTop: 28 }}
      >
        <Logo size={52} />
        Напиши «ЖИМ» в {BOT}
      </Chip>
    </At>
  </Scene>
)

// 5. QR-код рядом с плашкой (узор условный)
const FakeQr = ({ size }: { size: number }) => {
  const n = 21
  const c = size / n
  const cells: ReactNode[] = []
  let s = 7
  const finder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7)
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      s = (s * 9301 + 49297) % 233280
      const fx = x % (n - 7)
      const fy = y % (n - 7)
      const on = finder(x, y)
        ? !(fx === 1 || fx === 5 || fy === 1 || fy === 5) || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4)
          ? !(x % (n - 7) === 6 || y % (n - 7) === 6)
          : false
        : s / 233280 > 0.5
      if (on) cells.push(<rect key={`${x}-${y}`} x={x * c} y={y * c} width={c} height={c} fill={color.ink} />)
    }
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      {cells}
    </svg>
  )
}

export const Qr = () => (
  <Scene label="5 · QR-код">
    <At>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28 }}>
        <Card />
        <div
          style={{
            background: '#fff',
            border: `${line}px solid ${color.ink}`,
            boxShadow: `${lift}px ${lift}px 0 ${color.ink}`,
            padding: 14,
            flex: 'none',
          }}
        >
          <FakeQr size={168} />
        </div>
      </div>
    </At>
  </Scene>
)

// 3. Финальная заставка
export const EndCard = () => (
  <AbsoluteFill style={{ background: color.paper, alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 56, marginTop: -160 }}>
      <Logo size={300} />
      <div
        style={{
          fontFamily: font.display,
          fontWeight: 600,
          fontSize: 140,
          color: color.ink,
          lineHeight: 1,
        }}
      >
        СпортБот
      </div>
      <div style={{ fontFamily: font.sans, fontSize: 46, color: color.ink, textAlign: 'center', lineHeight: 1.3, maxWidth: 820 }}>
        Программа с этим упражнением — бесплатно
      </div>
      <Chip fill={color.mint} style={{ fontSize: 46, padding: '20px 36px' }}>
        Найди «СпортБот» в Telegram и MAX
      </Chip>
    </div>
    <div
      style={{
        position: 'absolute',
        top: 60,
        left: 48,
        fontFamily: font.display,
        fontSize: 64,
        fontWeight: 600,
        color: color.ink,
        textTransform: 'uppercase',
      }}
    >
      3 · заставка в конце
    </div>
  </AbsoluteFill>
)

// 2. Бот отдаёт файл вместе с готовой подписью для поста
export const BotCaption = () => {
  const bubble: CSSProperties = {
    background: dark.sheet,
    border: `3px solid ${dark.rule}`,
    borderRadius: 34,
    padding: 30,
    fontFamily: font.sans,
    color: dark.ink,
    fontSize: 36,
    lineHeight: 1.4,
    width: 900,
  }
  return (
    <AbsoluteFill style={{ background: dark.paper, padding: '200px 70px', gap: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 30 }}>
        <Logo size={96} />
        <div style={{ fontFamily: font.sans, color: dark.ink }}>
          <div style={{ fontSize: 44, fontWeight: 600 }}>Спортбот</div>
          <div style={{ fontSize: 30, opacity: 0.6 }}>бот</div>
        </div>
      </div>
      <div style={bubble}>
        <div
          style={{
            height: 380,
            borderRadius: 20,
            background: 'radial-gradient(circle at 50% 35%, #4a4f5c 0%, #23262e 70%)',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: 22,
          }}
        >
          <div style={{ position: 'absolute', left: 40, bottom: 50, width: 560 }}>
            <LowerThirdCard title={TITLE} subtitle={SUB} fill="mint" unit={560} />
          </div>
        </div>
        <span style={{ opacity: 0.6, fontSize: 30 }}>zhim-ganteley-lezha-lower-third.mov · 2.1 МБ</span>
        <div style={{ marginTop: 18 }}>Плашка «{TITLE}» готова.</div>
      </div>
      <div style={bubble}>
        <div style={{ fontSize: 30, opacity: 0.6, marginBottom: 14 }}>Текст для поста — нажми, чтобы скопировать:</div>
        <div
          style={{
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: 32,
            background: dark.paper,
            borderRadius: 16,
            padding: 24,
          }}
        >
          {TITLE} — техника и программа в боте 👉{' '}
          <span style={{ color: dark.blue }}>t.me/sportbot?start=ex_142_r_9f3a</span>
        </div>
      </div>
      <div
        style={{
          fontFamily: font.display,
          fontSize: 64,
          fontWeight: 600,
          color: dark.ink,
          textTransform: 'uppercase',
          position: 'absolute',
          top: 60,
          left: 48,
        }}
      >
        2 · подпись от бота
      </div>
    </AbsoluteFill>
  )
}

export const VARIANTS = { BadgeChip, BadgeStrip, BadgeCorner, BotCaption, EndCard, Keyword, Qr }

// Все варианты одним листом
export const Sheet = () => {
  const list = Object.values(VARIANTS)
  const s = 0.4
  return (
    <AbsoluteFill style={{ background: '#e9e4dc', flexDirection: 'row', flexWrap: 'wrap', gap: 40, padding: 40 }}>
      {list.map((V, i) => (
        <div key={i} style={{ width: W * s, height: H * s, overflow: 'hidden', border: `4px solid ${color.ink}` }}>
          <div style={{ width: W, height: H, transform: `scale(${s})`, transformOrigin: '0 0', position: 'relative' }}>
            <V />
          </div>
        </div>
      ))}
    </AbsoluteFill>
  )
}

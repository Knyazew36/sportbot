import { COMPOSITION_IDS, COMPOSITIONS } from '@sportbot/render-contract'
import { compositionOf, formats, waitForFonts } from '@sportbot/video'
import { LogoSting, type LogoStingProps } from '@sportbot/video/compositions/LogoSting'
import { LowerThird, type LowerThirdProps } from '@sportbot/video/compositions/LowerThird'
import { NumberCard, type NumberCardProps } from '@sportbot/video/compositions/NumberCard'
import { type CalculateMetadataFunction, Composition } from 'remotion'

waitForFonts()

const { reels, post, square } = formats

// Оверлей: кнопка Render в Studio сразу предлагает ProRes 4444 с альфой, а не MP4 с чёрным фоном.
// В приложении тот же формат уходит лёгким PNG-в-MOV (mov-alpha) — Studio ffmpeg не подменяет
const overlay: CalculateMetadataFunction<LowerThirdProps> = async () => ({
  defaultCodec: 'prores',
  defaultProResProfile: '4444',
  defaultPixelFormat: 'yuva444p10le',
  defaultVideoImageFormat: 'png',
})

const demoLowerThird = COMPOSITIONS['lower-third'].example

export const Root = () => (
  <>
    {/* Композиции, которые пользователи рендерят из приложения: id и props — из контракта, как на сервере */}
    {COMPOSITION_IDS.map((id) => {
      const { component, schema, ...meta } = compositionOf(id)
      return (
        <Composition
          key={id}
          {...meta}
          component={component}
          schema={schema}
          calculateMetadata={overlay}
        />
      )
    })}

    <Composition
      id='Logo-Reels'
      component={LogoSting}
      durationInFrames={75}
      {...reels}
      defaultProps={{ mode: 'intro', background: 'paper' } satisfies LogoStingProps}
    />
    <Composition
      id='Logo-Square'
      component={LogoSting}
      durationInFrames={75}
      {...square}
      defaultProps={{ mode: 'intro', background: 'paper' } satisfies LogoStingProps}
    />
    <Composition
      id='Number-Reels'
      component={NumberCard}
      durationInFrames={120}
      {...reels}
      defaultProps={
        { value: 30, unit: 'дней', label: 'Серия без пропусков', fill: 'mint', background: 'paper' } satisfies NumberCardProps
      }
    />
    <Composition
      id='Number-Post'
      component={NumberCard}
      durationInFrames={120}
      {...post}
      defaultProps={
        { value: 120, unit: 'кг', label: 'Новый рекорд в жиме лёжа', fill: 'mint', background: 'paper' } satisfies NumberCardProps
      }
    />
    <Composition
      id='LowerThird-Rose-Reels'
      component={LowerThird}
      durationInFrames={COMPOSITIONS['lower-third'].durationInFrames}
      {...reels}
      calculateMetadata={overlay}
      defaultProps={{ ...demoLowerThird, fill: 'rose' } satisfies LowerThirdProps}
    />
  </>
)

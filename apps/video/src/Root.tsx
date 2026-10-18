import { COMPOSITION_IDS, type CompositionId, type CompositionProps } from '@sportbot/render-contract'
import { compositionOf, durationOf, waitForFonts } from '@sportbot/video'
import { type CalculateMetadataFunction, Composition } from 'remotion'

waitForFonts()

// Оверлей: кнопка Render в Studio сразу предлагает ProRes 4444 с альфой, а не MP4 с чёрным фоном.
// В приложении тот же формат уходит лёгким PNG-в-MOV (mov-alpha) — Studio ffmpeg не подменяет.
// Длина — от props.seconds: так же её считает сервер через selectComposition
const overlay =
  (id: CompositionId): CalculateMetadataFunction<CompositionProps<CompositionId>> =>
  async ({ props }) => ({
    durationInFrames: durationOf(id, props),
    defaultCodec: 'prores',
    defaultProResProfile: '4444',
    defaultPixelFormat: 'yuva444p10le',
    defaultVideoImageFormat: 'png',
  })

// Только композиции, которые пользователи рендерят из приложения: id и props — из контракта, как на сервере
export const Root = () => (
  <>
    {COMPOSITION_IDS.map((id) => {
      const { component, schema, ...meta } = compositionOf(id)
      return (
        <Composition
          key={id}
          {...meta}
          component={component}
          schema={schema}
          calculateMetadata={overlay(id)}
        />
      )
    })}
  </>
)

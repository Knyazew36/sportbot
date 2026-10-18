import { Composition } from 'remotion'

import { formats } from './brand'
import './fonts'
import { LogoSting, type LogoStingProps } from './compositions/LogoSting'
import { LowerThird, type LowerThirdProps } from './compositions/LowerThird'
import { NumberCard, type NumberCardProps } from './compositions/NumberCard'

const { reels, post, square } = formats

export const Root = () => (
  <>
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
      id='LowerThird-Reels'
      component={LowerThird}
      durationInFrames={150}
      {...reels}
      defaultProps={
        {
          title: 'Жим гантелей на наклонной',
          subtitle: '4 подхода × 10 повторов',
          fill: 'mint',
          background: 'transparent',
        } satisfies LowerThirdProps
      }
    />
  </>
)

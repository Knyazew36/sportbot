import { AbsoluteFill } from 'remotion'

import { color } from '../brand'

export type BackgroundKind = 'paper' | 'transparent'

export const Background = ({ kind }: { kind: BackgroundKind }) =>
  kind === 'paper' ? <AbsoluteFill style={{ background: color.paper }} /> : null

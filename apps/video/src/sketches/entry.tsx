import { waitForFonts } from '@sportbot/video'
import { Still, registerRoot } from 'remotion'

import { Sheet, VARIANTS } from './CtaVariants'

waitForFonts()

const Root = () => (
  <>
    {Object.entries(VARIANTS).map(([id, C]) => (
      <Still key={id} id={id} component={C} width={1080} height={1920} />
    ))}
    <Still id="Sheet" component={Sheet} width={4 * 432 + 5 * 40} height={2 * 768 + 3 * 40} />
  </>
)

registerRoot(Root)

import { useThemeChoice } from '@/shared/lib/hooks/use-messenger-theme'
import { usePaletteChoice } from '@/shared/lib/hooks/use-palette'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Text } from '@/shared/ui/kit/Typography'

import { PALETTES, THEME_OPTIONS } from './options'

// Оформление: расцветку подбирает пол (поле под именем), здесь её можно сменить вручную; тема от неё независима.
// По умолчанию синяя и как в мессенджере. Применяется сразу
export const ThemeSection = () => {
  const [palette, setPalette] = usePaletteChoice()
  const [choice, setChoice] = useThemeChoice()

  return (
    <ScreenSection>
      <Segmented
        options={PALETTES}
        value={palette}
        onValueChange={setPalette}
        size='default'
        stretch
      />
      <Segmented
        options={THEME_OPTIONS}
        value={choice}
        onValueChange={setChoice}
        size='default'
        stretch
      />
      <Text
        size='xs'
        tone='muted'
      >
        {choice === 'auto' ? 'Тема как в мессенджере' : 'Своя тема на этом устройстве — мессенджер её не меняет'}
      </Text>
    </ScreenSection>
  )
}

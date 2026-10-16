import { type ThemeChoice, useThemeChoice } from '@/shared/lib/hooks/use-messenger-theme'
import { type Palette, usePaletteChoice } from '@/shared/lib/hooks/use-palette'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Text } from '@/shared/ui/kit/Typography'

const PALETTES: { value: Palette; label: string }[] = [
  { value: 'classic', label: 'Синяя' },
  { value: 'rose', label: 'Розовая' },
]

const OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: 'auto', label: 'Авто' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
]

// Оформление: расцветку подбирает пол (поле под именем), здесь её можно сменить вручную; тема от неё независима.
// По умолчанию синяя и как в мессенджере. Применяется сразу
export const ThemeSection = () => {
  const [palette, setPalette] = usePaletteChoice()
  const [choice, setChoice] = useThemeChoice()

  return (
    <ScreenSection
      variant='block'
      index={8}
      title='Оформление'
    >
      <Segmented
        options={PALETTES}
        value={palette}
        onValueChange={setPalette}
        size='default'
        stretch
      />
      <Segmented
        options={OPTIONS}
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

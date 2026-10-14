import { type ThemeChoice, useThemeChoice } from '@/shared/lib/hooks/use-messenger-theme'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Text } from '@/shared/ui/kit/Typography'

const OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: 'auto', label: 'Авто' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
]

// Тема оформления: по умолчанию как в мессенджере, можно закрепить свою. Применяется сразу
export const ThemeSection = () => {
  const [choice, setChoice] = useThemeChoice()

  return (
    <ScreenSection
      variant='block'
      index={8}
      title='Оформление'
    >
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

import { GENDERS, type Profile, useUpdateProfile } from '@/entities/profile'
import { type ThemeChoice, useThemeChoice } from '@/shared/lib/hooks/use-messenger-theme'
import { type Gender, type Palette, paletteForGender, usePaletteChoice } from '@/shared/lib/hooks/use-palette'
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

// Оформление: пол подбирает расцветку, расцветку можно сменить вручную; тема от них независима.
// По умолчанию синяя и как в мессенджере. Применяется сразу
export const ThemeSection = ({ profile }: { profile: Profile }) => {
  const [palette, setPalette] = usePaletteChoice()
  const [choice, setChoice] = useThemeChoice()
  const update = useUpdateProfile()

  const changeGender = (gender: Gender) =>
    update.mutate({ gender }, { onSuccess: () => setPalette(paletteForGender(gender)) })

  return (
    <ScreenSection
      variant='block'
      index={8}
      title='Оформление'
    >
      <Segmented
        options={GENDERS}
        // Старые пользователи пол не выбирали — тогда ни один сегмент не нажат
        value={(profile.gender ?? '') as Gender}
        onValueChange={changeGender}
        size='default'
        stretch
      />
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

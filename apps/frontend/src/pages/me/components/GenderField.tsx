import { GENDERS, type Profile, useUpdateProfile } from '@/entities/profile'
import { type Gender, paletteForGender, usePaletteChoice } from '@/shared/lib/hooks/use-palette'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Field, FieldTitle } from '@/shared/ui/shadcn/field'

// Пол — данные о себе, поэтому рядом с именем, а не в оформлении.
// Заодно подбирает расцветку; вручную её меняют в «Оформлении»
export const GenderField = ({ profile }: { profile: Profile }) => {
  const [, setPalette] = usePaletteChoice()
  const update = useUpdateProfile()

  const changeGender = (gender: Gender) =>
    update.mutate({ gender }, { onSuccess: () => setPalette(paletteForGender(gender)) })

  return (
    <Field>
      <FieldTitle>Пол</FieldTitle>
      <Segmented
        options={GENDERS}
        // Старые пользователи пол не выбирали — тогда ни один сегмент не нажат
        value={(profile.gender ?? '') as Gender}
        onValueChange={changeGender}
        size='default'
        stretch
      />
    </Field>
  )
}

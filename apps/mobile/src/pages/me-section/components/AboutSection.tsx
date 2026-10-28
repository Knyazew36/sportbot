import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { displayNameSchema, type DisplayNameValues, type Gender, GENDERS, paletteForGender, type Profile } from '@sportbot/api/entities/profile';
import { useUpdateProfile } from '@/shared/local/entities/profile';
import { sportUserKeys } from '@sportbot/api/entities/sport-user';

import { applyFieldErrors } from '@/shared/lib/form';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Segmented } from '@/shared/ui/kit/Segmented';
import { TextField } from '@/shared/ui/kit/TextField';
import { Text } from '@/shared/ui/kit/Typography';

// Имя, которое видят друзья: сохраняется при уходе из поля
const NameForm = ({ profile }: { profile: Profile }) => {
  const update = useUpdateProfile();
  const queryClient = useQueryClient();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DisplayNameValues>({
    resolver: zodResolver(displayNameSchema),
    values: { displayName: profile.displayName },
  });

  const save = handleSubmit(({ displayName }) => {
    if (displayName === profile.displayName) return;
    return update
      .mutateAsync({ displayName })
      .then(() => queryClient.invalidateQueries({ queryKey: sportUserKeys.me }))
      .catch((error) => applyFieldErrors(error, setError));
  });

  return (
    <Controller
      control={control}
      name="displayName"
      render={({ field: { value, onChange, onBlur } }) => (
        <TextField
          label="Имя для друзей"
          value={value}
          onChangeText={onChange}
          onBlur={() => {
            onBlur();
            void save();
          }}
          returnKeyType="done"
          autoComplete="name"
          error={errors.displayName}
        />
      )}
    />
  );
};

// Пол — данные о себе, поэтому рядом с именем, а не в оформлении.
// Заодно подбирает расцветку; вручную её меняют в «Оформлении»
const GenderField = ({ profile }: { profile: Profile }) => {
  const { setPalette } = useTheme();
  const update = useUpdateProfile();

  return (
    <View className="gap-1.5">
      <Text size="sm" tone="soft">
        Пол
      </Text>
      <Segmented
        options={GENDERS}
        // Старые пользователи пол не выбирали — тогда ни один сегмент не нажат
        value={(profile.gender ?? '') as Gender}
        onValueChange={(gender) => update.mutate({ gender }, { onSuccess: () => setPalette(paletteForGender(gender)) })}
        stretch
      />
    </View>
  );
};

// Имя и пол — порт pages/me-section/components/AboutSection.tsx: имя видят друзья, пол заодно подбирает расцветку
export const AboutSection = ({ profile }: { profile: Profile }) => (
  <ScreenSection className="gap-5">
    <NameForm profile={profile} />
    <GenderField profile={profile} />
  </ScreenSection>
);

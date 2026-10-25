import * as ImagePicker from 'expo-image-picker';

import { useUploadAvatar } from '@sportbot/api/entities/profile';

// Фото с телефона на карту участника: галерея с обрезкой в квадрат — аватар круглый.
// Разрешение на галерею не нужно: системный выбор фото отдаёт только выбранный снимок
export const usePickAvatar = () => {
  const upload = useUploadAvatar();

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;
    upload.mutate({
      uri: asset.uri,
      name: asset.fileName ?? 'avatar.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    });
  };

  return { pick, pending: upload.isPending };
};

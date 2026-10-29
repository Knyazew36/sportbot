import * as ImagePicker from 'expo-image-picker';
import { toast } from '@/shared/ui/kit/toast';

import { useUploadAvatar } from '@sportbot/api/entities/profile';

import { useIsOnline } from '@/shared/api';

// Фото с телефона на карту участника: галерея с обрезкой в квадрат — аватар круглый.
// Разрешение на галерею не нужно: системный выбор фото отдаёт только выбранный снимок.
// Без сети кнопку не гасим, а объясняем тостом: у иконки нет подписи, погасшая выглядит сломанной
export const usePickAvatar = () => {
  const upload = useUploadAvatar();
  const online = useIsOnline();

  const pick = async () => {
    if (!online) {
      toast.error('Смена аватара доступна только в онлайне');
      return;
    }
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

import { Prisma } from '@/generated/prisma/client';
import { UploadService } from '../../upload/upload.service';

/**
 * Профиль из VK Bridge (VKWebAppGetUserInfo), который фронт присылает при входе через
 * VK Mini App и который бэк складывает в User.vkData.profile — см. upsertVkUserFromLaunchParams.
 * Launch-параметры сами по себе имя/фото не несут, поэтому это единственный источник
 * для VK-only пользователя, ничего в БД под это не заводим.
 */
interface VkProfileSnapshot {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

/**
 * Два источника формы vkData: Mini App кладёт снимок в `profile`, а VK ID OAuth —
 * сырой профиль из user_info в корень (first_name/last_name/avatar). Читаем оба,
 * чтобы не переписывать уже сохранённые строки.
 */
function readVkProfile(
  vkData: Prisma.JsonValue | null | undefined,
): VkProfileSnapshot | null {
  if (!vkData || typeof vkData !== 'object' || Array.isArray(vkData)) {
    return null;
  }
  const data = vkData as Record<string, unknown>;
  const profile = data.profile;
  if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
    return profile as VkProfileSnapshot;
  }
  return {
    firstName: typeof data.first_name === 'string' ? data.first_name : undefined,
    lastName: typeof data.last_name === 'string' ? data.last_name : undefined,
    avatarUrl: typeof data.avatar === 'string' ? data.avatar : undefined,
  };
}

/** Аватар: свой загруженный файл в приоритете, иначе фото из VK-профиля (если есть). */
export function resolveAvatarUrl(
  avatarPath: string | null,
  vkData: Prisma.JsonValue | null | undefined,
  uploadService: UploadService,
): string | null {
  return (
    uploadService.toPublicUrl(avatarPath) ??
    readVkProfile(vkData)?.avatarUrl ??
    null
  );
}

/** Имя/фамилия: свои заполненные значения в приоритете, иначе — из VK-профиля. */
export function resolveVkName(
  name: string | null,
  lastName: string | null,
  vkData: Prisma.JsonValue | null | undefined,
): { name: string | null; lastName: string | null } {
  if (name || lastName) {
    return { name, lastName };
  }
  const profile = readVkProfile(vkData);
  if (!profile) {
    return { name, lastName };
  }
  return { name: profile.firstName ?? null, lastName: profile.lastName ?? null };
}

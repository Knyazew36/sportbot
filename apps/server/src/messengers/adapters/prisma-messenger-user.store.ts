import { Injectable } from '@nestjs/common';

import { Prisma, User } from '@/generated/prisma/client';
import {
  MessengerChannelKey,
  MessengerUserPatch,
  MessengerUserStore,
} from '@/messengers';
import { PrismaService } from 'prisma/prisma.service';

/** В каких колонках User лежит аккаунт каждого мессенджера и его профиль. */
const COLUMNS = {
  TELEGRAM: { id: 'telegramId', profile: 'telegramData' },
  MAX: { id: 'maxId', profile: 'maxData' },
  VK: { id: 'vkId', profile: 'vkData' },
} as const satisfies Record<
  MessengerChannelKey,
  { id: keyof User; profile: keyof User }
>;

/**
 * Хранилище пользователей для модулей мессенджеров поверх Prisma-модели User этого проекта.
 * Возвращает полные строки User: стратегии мини-приложений кладут их в req.user как есть.
 */
@Injectable()
export class PrismaMessengerUserStore extends MessengerUserStore {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  public findByExternalId(
    channel: MessengerChannelKey,
    externalId: string,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: this.whereExternal(channel, externalId),
    });
  }

  public upsertByExternalId(
    channel: MessengerChannelKey,
    externalId: string,
    patch: MessengerUserPatch,
  ): Promise<User> {
    const data = this.toData(channel, patch);
    return this.prisma.user.upsert({
      where: this.whereExternal(channel, externalId),
      update: data,
      create: {
        [COLUMNS[channel].id]: externalId,
        ...data,
      },
    });
  }

  public update(
    userId: number,
    channel: MessengerChannelKey,
    patch: MessengerUserPatch,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: this.toData(channel, patch),
    });
  }

  private whereExternal(
    channel: MessengerChannelKey,
    externalId: string,
  ): Prisma.UserWhereUniqueInput {
    return {
      [COLUMNS[channel].id]: externalId,
    } as unknown as Prisma.UserWhereUniqueInput;
  }

  /** undefined-поля Prisma пропускает — «не передано» из патча так и остаётся «не трогать». */
  private toData(channel: MessengerChannelKey, patch: MessengerUserPatch) {
    return {
      [COLUMNS[channel].profile]: patch.profile as
        Prisma.InputJsonValue | undefined,
      data: patch.data as Prisma.InputJsonValue | undefined,
    } satisfies Prisma.UserUncheckedUpdateInput;
  }
}

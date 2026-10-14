import { applyDecorators, UseGuards } from '@nestjs/common';

import { MultiAuthGuard } from '@/common/guards/multi-auth.guard';

import { BotAdminGuard } from '../guards/bot-admin.guard';
import { SportUserGuard } from '../guards/sport-user.guard';

/** Пользователь Mini App: вход по данным запуска мессенджера и проверка блокировки. */
export const SportAuth = () => UseGuards(MultiAuthGuard, SportUserGuard);

/** Администратор спортбота. */
export const SportAdmin = () =>
  applyDecorators(UseGuards(MultiAuthGuard, SportUserGuard, BotAdminGuard));

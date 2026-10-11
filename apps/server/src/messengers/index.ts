/** Публичный API общего слоя мессенджеров — импортировать только отсюда (`@/messengers`). */
export { MessengersModule } from './messengers.module';
export type { MessengersModuleOptions } from './messengers.module';
export { MessengerRegistry } from './messenger.registry';
export { MessengerUserStore } from './messenger.types';
export type {
  MessengerButton,
  MessengerCallbackMessage,
  MessengerChannel,
  MessengerChannelKey,
  MessengerMessage,
  MessengerUser,
  MessengerUserPatch,
} from './messenger.types';

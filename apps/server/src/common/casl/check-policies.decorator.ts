import { SetMetadata } from '@nestjs/common';

import { AppAbility } from './ability.factory';

export const CHECK_POLICIES_KEY = 'check_policies';

export type PolicyHandlerCallback = (ability: AppAbility) => boolean;

// Пример: @CheckPolicies(ability => ability.can('manage', 'Invite'))
export const CheckPolicies = (...handlers: PolicyHandlerCallback[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);

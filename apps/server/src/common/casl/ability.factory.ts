import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';

import { OrgRole } from '@/generated/prisma/client';

import { AppAction, AppSubject } from './ability.types';

export type AppAbility = MongoAbility<[AppAction, AppSubject]>;

export interface AbilitySubject {
  role: OrgRole;
}

// Единственное место, где описаны права в организации. Проект расширяет правила своими субъектами.
@Injectable()
export class AbilityFactory {
  createForOrganizationMember({ role }: AbilitySubject): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (role === OrgRole.OWNER) {
      can('manage', 'all');
      return build();
    }

    if (role === OrgRole.ADMIN) {
      can('read', 'Organization');
      can('manage', ['Member', 'Invite', 'JoinRequest']);
      return build();
    }

    if (role === OrgRole.MEMBER) {
      can('read', 'Organization');
      // Выход из организации. Кого именно можно удалять, решает сервис.
      can('delete', 'Member');
      return build();
    }

    return build();
  }
}

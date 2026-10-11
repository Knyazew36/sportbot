import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability'
import { Injectable } from '@nestjs/common'

import { OrgRole } from '@/generated/prisma/client'

import { AppAction, AppSubject } from './ability.types'

export type AppAbility = MongoAbility<[AppAction, AppSubject]>

export interface AbilitySubject {
  role: OrgRole
}

// Единственное место, где описаны права в кружке. Владелец ведёт кружок, участник (родитель/ребёнок)
// смотрит расписание и записывается. Проверки "свой ребёнок / сам себя" живут в сервисах (where по parents).
@Injectable()
export class AbilityFactory {
  createForOrganizationMember({ role }: AbilitySubject): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

    if (role === OrgRole.OWNER) {
      can('manage', 'all')
      return build()
    }

    if (role === OrgRole.MEMBER) {
      can('read', ['Organization', 'Group', 'Lesson', 'ScheduleRule'])
      // Запись себя и своих детей на занятие. Группа и принадлежность детей проверяются в сервисе.
      can(['create', 'update', 'delete'], 'LessonAttendance')
      // Выход себя или своего ребёнка из кружка. Кого именно можно удалять, решает сервис.
      can('delete', 'Member')
      return build()
    }

    return build()
  }
}

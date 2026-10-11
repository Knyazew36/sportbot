import { Global, Module } from '@nestjs/common';

import { PrismaModule } from '@/common/prisma/prisma.module';

import { GroupScopeGuard } from './group-scope.guard';
import { OrgScopeGuard } from './org-scope.guard';
import { PlatformAdminGuard } from './platform-admin.guard';
import { ResourceScopeGuard } from './resource-scope.guard';

/**
 * Скоуп-гвард организации + группы + единый `ResourceScopeGuard` для leaf-сущностей
 * (`@ResourceScope('invite'|'scheduleRule'|'lesson')`) + гвард платформенного админа.
 * Подключаются через `@UseGuards(...)` после аутентификации (`MultiAuthGuard`).
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [OrgScopeGuard, GroupScopeGuard, ResourceScopeGuard, PlatformAdminGuard],
  exports: [OrgScopeGuard, GroupScopeGuard, ResourceScopeGuard, PlatformAdminGuard],
})
export class GuardsModule {}

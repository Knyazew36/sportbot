import { Global, Module } from '@nestjs/common';

import { PrismaModule } from '@/common/prisma/prisma.module';

import { OrgScopeGuard } from './org-scope.guard';
import { PlatformAdminGuard } from './platform-admin.guard';
import { ResourceScopeGuard } from './resource-scope.guard';

/**
 * Скоуп-гвард организации + единый `ResourceScopeGuard` для leaf-сущностей
 * (`@ResourceScope('invite'|'joinRequest')`) + гвард платформенного админа.
 * Подключаются через `@UseGuards(...)` после аутентификации (`MultiAuthGuard`).
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [OrgScopeGuard, ResourceScopeGuard, PlatformAdminGuard],
  exports: [OrgScopeGuard, ResourceScopeGuard, PlatformAdminGuard],
})
export class GuardsModule {}

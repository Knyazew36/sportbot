import { SetMetadata } from '@nestjs/common';

/**
 * Leaf-сущности, доступ к которым проверяется через `<entity>.organizationId`.
 * Обрабатываются одним `ResourceScopeGuard`.
 */
export type ScopedResource = 'invite' | 'joinRequest';

export const RESOURCE_SCOPE_KEY = 'resource_scope';

/**
 * Помечает ручку сущностью для `ResourceScopeGuard`: гвард найдёт `:id`, поднимется
 * до организации и проверит доступ (как `OrgScopeGuard`), затем положит
 * `<entity>Id` в request. Требуемую роль задаёт `@RequireOrgRole(...)`.
 */
export const ResourceScope = (resource: ScopedResource) =>
  SetMetadata(RESOURCE_SCOPE_KEY, resource);

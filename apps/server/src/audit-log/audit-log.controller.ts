import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { OrganizationId } from '@/common/decorators/organization-id.decorator';
import { RequireOrgRole } from '@/common/decorators/require-org-role.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { MultiAuthGuard } from '@/common/guards/multi-auth.guard';
import { OrgScopeGuard } from '@/common/guards/org-scope.guard';
import { OrgRole } from '@/generated/prisma/client';

import { AuditLogService } from './audit-log.service';
import { AuditLogItemDto } from './dto/audit-log-item.dto';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

// Журнал только читается: строки пишет AuditLogInterceptor, чистит AuditLogRetentionService —
// поэтому create/update/delete-эндпоинтов у сущности нет намеренно.
@ApiTags('audit-log')
@UseGuards(MultiAuthGuard, OrgScopeGuard)
@RequireOrgRole(OrgRole.ADMIN)
@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('list')
  @Swagger({
    title: 'Журнал действий организации (OWNER/ADMIN)',
    response: AuditLogItemDto,
    isArray: true,
    query: QueryAuditLogDto,
    bearerAuth: true,
  })
  list(
    @OrganizationId() organizationId: number,
    @Query() query: QueryAuditLogDto,
  ) {
    return this.auditLogService.list(organizationId, query);
  }
}

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AuditLogRetentionService } from './audit-log-retention.service';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';

@Module({
  controllers: [AuditLogController],
  providers: [
    AuditLogService,
    AuditLogRetentionService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
  exports: [AuditLogService, AuditLogRetentionService],
})
export class AuditLogModule {}

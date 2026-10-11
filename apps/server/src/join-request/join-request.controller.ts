import { CheckPolicies, PoliciesGuard } from '@/common/casl';
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { OrganizationId } from '@/common/decorators/organization-id.decorator';
import { ResourceScope } from '@/common/decorators/resource-scope.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { MultiAuthGuard } from '@/common/guards/multi-auth.guard';
import { OrgScopeGuard } from '@/common/guards/org-scope.guard';
import { ResourceScopeGuard } from '@/common/guards/resource-scope.guard';

import { JoinRequestQueryDto } from './dto/join-request-query.dto';
import { JoinRequestResponseDto } from './dto/join-request.response.dto';
import { JoinRequestService } from './join-request.service';

@ApiTags('join-request')
@Controller('join-request')
export class JoinRequestController {
  constructor(private readonly joinRequestService: JoinRequestService) {}

  // --- 'mine' объявлен до ':id', чтобы не парсился как id ---

  @Get('mine')
  @UseGuards(MultiAuthGuard)
  @Swagger({
    title:
      'Мои заявки на вступление во все организации (для отображения статуса «ждёт одобрения»)',
    response: JoinRequestResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  listMine(@CurrentUser('id') userId: number) {
    return this.joinRequestService.listMine(userId);
  }

  @Get('list')
  @UseGuards(MultiAuthGuard, OrgScopeGuard, PoliciesGuard)
  @CheckPolicies((a) => a.can('manage', 'JoinRequest'))
  @Swagger({
    title:
      'Заявки на вступление в организацию (OWNER/ADMIN, фильтр ?organizationId=&status=)',
    query: JoinRequestQueryDto,
    response: JoinRequestResponseDto,
    isArray: true,
    bearerAuth: true,
  })
  list(
    @OrganizationId() organizationId: number,
    @Query() query: JoinRequestQueryDto,
  ) {
    return this.joinRequestService.list(organizationId, query);
  }

  @Post(':id/approve')
  @UseGuards(MultiAuthGuard, ResourceScopeGuard, PoliciesGuard)
  @ResourceScope('joinRequest')
  @CheckPolicies((a) => a.can('manage', 'JoinRequest'))
  @Swagger({
    title: 'Одобрить заявку — заявитель становится участником организации',
    param: { name: 'id', type: Number },
    response: JoinRequestResponseDto,
    bearerAuth: true,
  })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') ownerId: number,
  ) {
    return this.joinRequestService.approve(id, ownerId);
  }

  @Post(':id/reject')
  @UseGuards(MultiAuthGuard, ResourceScopeGuard, PoliciesGuard)
  @ResourceScope('joinRequest')
  @CheckPolicies((a) => a.can('manage', 'JoinRequest'))
  @Swagger({
    title: 'Отклонить заявку',
    param: { name: 'id', type: Number },
    response: JoinRequestResponseDto,
    bearerAuth: true,
  })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') ownerId: number,
  ) {
    return this.joinRequestService.reject(id, ownerId);
  }

  @Post(':id/cancel')
  @UseGuards(MultiAuthGuard)
  @Swagger({
    title: 'Отменить свою заявку, пока она не рассмотрена владельцем',
    param: { name: 'id', type: Number },
    response: JoinRequestResponseDto,
    bearerAuth: true,
  })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.joinRequestService.cancel(id, userId);
  }
}

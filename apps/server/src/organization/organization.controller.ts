import { CheckPolicies, PoliciesGuard } from '@/common/casl';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { SkipReadonlyCheck } from '@/common/decorators/skip-readonly-check.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { MultiAuthGuard } from '@/common/guards/multi-auth.guard';
import { OrgScopeGuard } from '@/common/guards/org-scope.guard';
import { PlatformAdminGuard } from '@/common/guards/platform-admin.guard';
import { PaginationQueryDto } from '@/common/type';
import { RequestWithOrganization } from '@/common/types/request-with-organization';
import { OrgRole, User } from '@/generated/prisma/client';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import { JoinOrganizationDto } from './dto/join-organization.dto';
import {
  OrganizationMemberDto,
  OrganizationResponseDto,
} from './dto/organization.response.dto';
import { DeleteMemberDto } from './dto/delete-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationService } from './organization.service';

@ApiTags('organization')
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  @UseGuards(MultiAuthGuard)
  @Swagger({
    title: 'Мои кружки (платформенный админ видит все)',
    query: PaginationQueryDto,
    response: OrganizationResponseDto,
    isArray: true,
    bearerAuth: true,
  })
  list(@Query() query: PaginationQueryDto, @CurrentUser() user: User) {
    return this.organizationService.list(query, {
      userId: user.id,
      isPlatformAdmin: user.isPlatformAdmin,
    });
  }

  @Post()
  @UseGuards(MultiAuthGuard)
  @Swagger({
    title: 'Создать кружок (создатель становится владельцем)',
    body: CreateOrganizationDto,
    response: OrganizationResponseDto,
    bearerAuth: true,
  })
  create(@CurrentUser('id') userId: number, @Body() dto: CreateOrganizationDto) {
    return this.organizationService.create(userId, dto);
  }

  @Get(':id/preview')
  @UseGuards(MultiAuthGuard)
  @Swagger({
    title: 'Превью открытой организации по прямой ссылке (без членства)',
    param: { name: 'id', type: Number },
    response: OrganizationResponseDto,
    bearerAuth: true,
  })
  preview(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.findById(id);
  }

  @Post(':id/join')
  @UseGuards(MultiAuthGuard)
  @Swagger({
    title: 'Вступить в открытую организацию по прямой ссылке (без приглашения)',
    param: { name: 'id', type: Number },
    body: JoinOrganizationDto,
    response: OrganizationMemberDto,
    bearerAuth: true,
  })
  join(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: JoinOrganizationDto,
  ) {
    return this.organizationService.join(id, userId, dto);
  }

  @Get(':id')
  @UseGuards(MultiAuthGuard, OrgScopeGuard)
  @Swagger({
    title: 'Карточка учреждения',
    param: { name: 'id', type: Number },
    response: OrganizationResponseDto,
    bearerAuth: true,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.findById(id);
  }

  @Post(':id/update')
  @UseGuards(MultiAuthGuard, OrgScopeGuard, PoliciesGuard)
  @CheckPolicies(a => a.can('manage', 'Organization'))
  @Swagger({
    title: 'Изменить учреждение',
    param: { name: 'id', type: Number },
    body: UpdateOrganizationDto,
    response: OrganizationResponseDto,
    bearerAuth: true,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationService.update(id, dto);
  }

  @Post(':id/delete')
  @UseGuards(MultiAuthGuard, OrgScopeGuard, PoliciesGuard)
  @CheckPolicies(a => a.can('manage', 'Organization'))
  // Удалить кружок можно и после окончания пробного периода — владелец должен иметь возможность выйти.
  @SkipReadonlyCheck()
  @Swagger({
    title: 'Мягко удалить кружок (владелец)',
    param: { name: 'id', type: Number },
    response: OrganizationResponseDto,
    bearerAuth: true,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.delete(id);
  }

  // restore не через OrgScopeGuard: он блокирует доступ к неактивному кружку
  // (assertOrgAccess → «Организация неактивна»). Восстановление — ops-операция
  // платформенного админа (обращение в поддержку).
  @Post(':id/restore')
  @UseGuards(MultiAuthGuard, PlatformAdminGuard)
  @Swagger({
    title: 'Восстановить кружок (платформенный админ / поддержка)',
    param: { name: 'id', type: Number },
    response: OrganizationResponseDto,
    bearerAuth: true,
  })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.restore(id);
  }

  @Post(':id/child/:childId/request')
  @UseGuards(MultiAuthGuard, OrgScopeGuard, PoliciesGuard)
  @CheckPolicies(a => a.can('read', 'Organization'))
  @Swagger({
    title: 'Пригласить своего ребёнка в кружок: открытый — вступит сразу, закрытый — заявка владельцу',
    param: { name: 'id', type: Number },
    bearerAuth: true,
  })
  requestForChild(
    @Param('id', ParseIntPipe) id: number,
    @Param('childId', ParseIntPipe) childId: number,
    @CurrentUser('id') callerId: number,
  ) {
    return this.organizationService.requestForChild(id, childId, callerId);
  }

  // --- члены организации ---

  @Get(':id/member')
  @UseGuards(MultiAuthGuard, OrgScopeGuard)
  @Swagger({
    title: 'Состав организации: владелец и участники',
    param: { name: 'id', type: Number },
    response: OrganizationMemberDto,
    plainArray: true,
    bearerAuth: true,
  })
  listMembers(@Param('id', ParseIntPipe) id: number, @Req() request: RequestWithOrganization) {
    return this.organizationService.listMembers(id, request.orgRole ?? null);
  }

  @Post(':id/member/:userId/update')
  @UseGuards(MultiAuthGuard, OrgScopeGuard, PoliciesGuard)
  @CheckPolicies(a => a.can('update', 'Member'))
  @Swagger({
    title: 'Сменить роль / передать владение',
    param: { name: 'id', type: Number },
    body: UpdateMemberDto,
    response: OrganizationMemberDto,
    bearerAuth: true,
  })
  updateMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.organizationService.updateMember(id, userId, dto);
  }

  // Кто именно может удалить, решает сервис: владелец — любого, участник — себя или своего ребёнка.
  @Post(':id/member/:userId/delete')
  @UseGuards(MultiAuthGuard, OrgScopeGuard, PoliciesGuard)
  @CheckPolicies(a => a.can('delete', 'Member'))
  @Swagger({
    title: 'Удалить участника (владелец — любого; участник — себя или своего ребёнка)',
    param: { name: 'id', type: Number },
    body: DeleteMemberDto,
    bearerAuth: true,
  })
  deleteMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: DeleteMemberDto,
    @CurrentUser('id') callerId: number,
  ) {
    return this.organizationService.deleteMember(id, userId, callerId, dto);
  }
}

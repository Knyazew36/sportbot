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
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { MultiAuthGuard } from '@/common/guards/multi-auth.guard';
import { OrgScopeGuard } from '@/common/guards/org-scope.guard';
import { PlatformAdminGuard } from '@/common/guards/platform-admin.guard';
import { PaginationQueryDto } from '@/common/type';
import { RequestWithOrganization } from '@/common/types/request-with-organization';
import { OrgRole, User } from '@/generated/prisma/client';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import {
  OrganizationMemberDto,
  OrganizationResponseDto,
} from './dto/organization.response.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationService } from './organization.service';

@ApiTags('organization')
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('list')
  @UseGuards(MultiAuthGuard)
  @Swagger({
    title: 'Мои организации (платформенный админ видит все)',
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

  @Post('create')
  @UseGuards(MultiAuthGuard)
  @Swagger({
    title: 'Создать организацию (создатель становится владельцем)',
    body: CreateOrganizationDto,
    response: OrganizationResponseDto,
    bearerAuth: true,
  })
  create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.organizationService.create(userId, dto);
  }

  @Get(':id')
  @UseGuards(MultiAuthGuard, OrgScopeGuard)
  @Swagger({
    title: 'Карточка организации',
    param: { name: 'id', type: Number },
    response: OrganizationResponseDto,
    bearerAuth: true,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.findById(id);
  }

  @Post('update/:id')
  @UseGuards(MultiAuthGuard, OrgScopeGuard, PoliciesGuard)
  @CheckPolicies((a) => a.can('manage', 'Organization'))
  @Swagger({
    title: 'Изменить организацию (владелец)',
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

  @Post('delete/:id')
  @UseGuards(MultiAuthGuard, OrgScopeGuard, PoliciesGuard)
  @CheckPolicies((a) => a.can('manage', 'Organization'))
  @Swagger({
    title: 'Мягко удалить организацию (владелец)',
    param: { name: 'id', type: Number },
    response: OrganizationResponseDto,
    bearerAuth: true,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.delete(id);
  }

  // restore не через OrgScopeGuard: он блокирует доступ к неактивной организации
  // (assertOrgAccess → «Организация недоступна»). Восстановление — ops-операция
  // платформенного админа (обращение в поддержку).
  @Post('restore/:id')
  @UseGuards(MultiAuthGuard, PlatformAdminGuard)
  @Swagger({
    title: 'Восстановить организацию (платформенный админ / поддержка)',
    param: { name: 'id', type: Number },
    response: OrganizationResponseDto,
    bearerAuth: true,
  })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.restore(id);
  }

  // --- участники организации ---

  @Get(':id/member/list')
  @UseGuards(MultiAuthGuard, OrgScopeGuard)
  @Swagger({
    title: 'Состав организации',
    param: { name: 'id', type: Number },
    response: OrganizationMemberDto,
    plainArray: true,
    bearerAuth: true,
  })
  listMembers(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: RequestWithOrganization,
  ) {
    return this.organizationService.listMembers(id, request.orgRole ?? null);
  }

  // Кого и до какой роли можно менять, решает сервис: владелец — любого, ADMIN — только MEMBER.
  @Post(':id/member/update/:userId')
  @UseGuards(MultiAuthGuard, OrgScopeGuard, PoliciesGuard)
  @CheckPolicies((a) => a.can('update', 'Member'))
  @Swagger({
    title: 'Сменить роль участника / передать владение',
    param: { name: 'id', type: Number },
    body: UpdateMemberDto,
    response: OrganizationMemberDto,
    bearerAuth: true,
  })
  updateMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateMemberDto,
    @Req() request: RequestWithOrganization,
  ) {
    return this.organizationService.updateMember(
      id,
      userId,
      dto,
      request.orgRole ?? OrgRole.MEMBER,
    );
  }

  // Кто именно может удалить, решает сервис: себя — любой, кроме владельца; другого — старший по роли.
  @Post(':id/member/delete/:userId')
  @UseGuards(MultiAuthGuard, OrgScopeGuard, PoliciesGuard)
  @CheckPolicies((a) => a.can('delete', 'Member'))
  @Swagger({
    title: 'Удалить участника или выйти из организации',
    param: { name: 'id', type: Number },
    bearerAuth: true,
  })
  deleteMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser('id') callerId: number,
    @Req() request: RequestWithOrganization,
  ) {
    return this.organizationService.deleteMember(id, userId, {
      userId: callerId,
      role: request.orgRole ?? OrgRole.MEMBER,
    });
  }
}

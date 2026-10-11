import { CheckPolicies, PoliciesGuard } from '@/common/casl';
import {
  Body,
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

import { CreateInviteDto } from './dto/create-invite.dto';
import { InviteQueryDto } from './dto/invite-query.dto';
import {
  InviteResponseDto,
  RedeemPreviewDto,
  RedeemResultDto,
} from './dto/invite.response.dto';
import { RedeemInviteDto, RedeemQueryDto } from './dto/redeem-invite.dto';
import { InviteService } from './invite.service';

@ApiTags('invite')
@Controller('invite')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  // --- redeem; объявлено до ':id', чтобы 'preview'/'redeem' не парсились как id ---

  // Публичный: страница /invite показывает "чья это организация" ещё до входа/регистрации.
  @Get('preview')
  @Swagger({
    title: 'Превью приглашения по ?token= (какая организация ждёт)',
    query: RedeemQueryDto,
    response: RedeemPreviewDto,
  })
  preview(@Query() query: RedeemQueryDto) {
    return this.inviteService.preview(query);
  }

  @Post('redeem')
  @UseGuards(MultiAuthGuard)
  @Swagger({
    title:
      'Подать заявку на вступление в организацию по ссылке-приглашению (ждёт одобрения владельца)',
    body: RedeemInviteDto,
    response: RedeemResultDto,
    bearerAuth: true,
  })
  redeem(@CurrentUser('id') userId: number, @Body() dto: RedeemInviteDto) {
    return this.inviteService.redeem(userId, dto);
  }

  // --- CRUD ---

  // Ссылки-приглашения (токены) видит только владелец: участнику они не нужны и дают возможность их раздать.
  @Get('list')
  @UseGuards(MultiAuthGuard, OrgScopeGuard, PoliciesGuard)
  @CheckPolicies((a) => a.can('manage', 'Invite'))
  @Swagger({
    title: 'Приглашения организации (фильтр ?organizationId=)',
    query: InviteQueryDto,
    response: InviteResponseDto,
    isArray: true,
    bearerAuth: true,
  })
  list(
    @OrganizationId() organizationId: number,
    @Query() query: InviteQueryDto,
  ) {
    return this.inviteService.list(organizationId, query);
  }

  @Post('create')
  @UseGuards(MultiAuthGuard, OrgScopeGuard, PoliciesGuard)
  @CheckPolicies((a) => a.can('manage', 'Invite'))
  @Swagger({
    title: 'Создать приглашение-ссылку организации',
    body: CreateInviteDto,
    response: InviteResponseDto,
    bearerAuth: true,
  })
  create(
    @CurrentUser('id') userId: number,
    @OrganizationId() organizationId: number,
    @Body() dto: CreateInviteDto,
  ) {
    return this.inviteService.create(userId, organizationId, dto);
  }

  @Get(':id')
  @UseGuards(MultiAuthGuard, ResourceScopeGuard, PoliciesGuard)
  @ResourceScope('invite')
  @CheckPolicies((a) => a.can('manage', 'Invite'))
  @Swagger({
    title: 'Карточка приглашения',
    param: { name: 'id', type: Number },
    response: InviteResponseDto,
    bearerAuth: true,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inviteService.findById(id);
  }

  @Post('delete/:id')
  @UseGuards(MultiAuthGuard, ResourceScopeGuard, PoliciesGuard)
  @ResourceScope('invite')
  @CheckPolicies((a) => a.can('manage', 'Invite'))
  @Swagger({
    title: 'Удалить приглашение',
    param: { name: 'id', type: Number },
    response: InviteResponseDto,
    bearerAuth: true,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.inviteService.delete(id);
  }
}

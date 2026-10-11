import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { MultiAuthGuard } from '@/common/guards/multi-auth.guard';

import { AuthService } from '../auth/auth.service';
import { UploadService } from '../upload/upload.service';
import { imageUploadInterceptorOptions } from '../upload/upload.utils';

import { ChildResponseDto } from './dto/child.response.dto';
import { CreateChildDto } from './dto/create-child.dto';
import { RedeemChildLinkDto } from './dto/redeem-child-link.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UploadAvatarDto } from './dto/upload-avatar.dto';
import { UserService } from './user.service';

@ApiTags('user')
@UseGuards(MultiAuthGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly uploadService: UploadService,
  ) {}

  @Get('me')
  @Swagger({
    title: 'Профиль текущего пользователя + capabilities',
    bearerAuth: true,
  })
  getMe(@CurrentUser('id') userId: number) {
    return this.authService.getMe(userId);
  }

  @Post('me/update')
  @Swagger({
    title: 'Обновить свой профиль (имя, фамилия, отображаемое имя)',
    body: UpdateProfileDto,
    bearerAuth: true,
  })
  async updateMe(
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    await this.userService.updateProfile(userId, dto);
    return this.authService.getMe(userId);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', imageUploadInterceptorOptions()))
  @ApiConsumes('multipart/form-data')
  @Swagger({
    title: 'Загрузить/сменить свой аватар',
    body: UploadAvatarDto,
    bearerAuth: true,
  })
  async uploadAvatar(
    @CurrentUser('id') userId: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не передан');
    }
    this.uploadService.verifyImageSignatureOrThrow(file);
    await this.userService.setAvatar(userId, file);
    return this.authService.getMe(userId);
  }

  // --- дети (родитель↔ребёнок) ---

  @Get('me/children')
  @Swagger({
    title: 'Список своих детей',
    response: ChildResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  listChildren(@CurrentUser('id') userId: number) {
    return this.userService.listChildren(userId);
  }

  @Post('me/children')
  @Swagger({
    title: 'Добавить ребёнка (создаёт профиль без входа и привязывает к себе)',
    body: CreateChildDto,
    response: ChildResponseDto,
    bearerAuth: true,
  })
  createChild(@CurrentUser('id') userId: number, @Body() dto: CreateChildDto) {
    return this.userService.createChild(userId, dto);
  }

  @Post('me/children/:id/update')
  @Swagger({
    title: 'Изменить данные своего ребёнка',
    param: { name: 'id', type: Number },
    body: UpdateChildDto,
    response: ChildResponseDto,
    bearerAuth: true,
  })
  updateChild(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChildDto,
  ) {
    return this.userService.updateChild(userId, id, dto);
  }

  @Post('me/children/:id/avatar')
  @UseInterceptors(FileInterceptor('file', imageUploadInterceptorOptions()))
  @ApiConsumes('multipart/form-data')
  @Swagger({
    title: 'Загрузить/сменить аватар своего ребёнка',
    param: { name: 'id', type: Number },
    body: UploadAvatarDto,
    response: ChildResponseDto,
    bearerAuth: true,
  })
  uploadChildAvatar(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не передан');
    }
    this.uploadService.verifyImageSignatureOrThrow(file);
    return this.userService.setChildAvatar(userId, id, file);
  }

  @Post('me/children/:id/link')
  @Swagger({
    title: 'Создать ссылку, чтобы второй родитель привязал этого ребёнка к себе (одноразовая, 7 дней)',
    param: { name: 'id', type: Number },
    bearerAuth: true,
  })
  createChildLink(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userService.createChildLink(userId, id);
  }

  @Post('child-link/redeem')
  @Swagger({
    title: 'Принять ссылку на ребёнка: ребёнок привязывается к текущему родителю',
    body: RedeemChildLinkDto,
    bearerAuth: true,
  })
  redeemChildLink(@CurrentUser('id') userId: number, @Body() dto: RedeemChildLinkDto) {
    return this.userService.redeemChildLink(userId, dto.token);
  }

  @Post('me/children/:id/delete')
  @Swagger({
    title: 'Отвязать ребёнка от себя',
    param: { name: 'id', type: Number },
    bearerAuth: true,
  })
  async removeChild(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.userService.removeChild(userId, id);
    return { removed: true };
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { MultiAuthGuard } from '@/common/guards/multi-auth.guard';
import { PlatformAdminGuard } from '@/common/guards/platform-admin.guard';
import { PaginationQueryDto } from '@/common/type';

import { AuthService } from '../auth/auth.service';
import { UploadService } from '../upload/upload.service';
import { CleanupStagedUploadsInterceptor } from '../upload/cleanup-staged-uploads.interceptor';
import { imageUploadInterceptorOptions } from '../upload/upload.utils';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UploadAvatarDto } from './dto/upload-avatar.dto';
import { UserResponseDto } from './dto/user.response.dto';
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

  // --- свой профиль ---

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
    title: 'Обновить свой профиль (имя, фамилия, телефон)',
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
  @UseInterceptors(
    CleanupStagedUploadsInterceptor,
    FileInterceptor('file', imageUploadInterceptorOptions()),
  )
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

  // --- CRUD: только платформенный администратор ---

  @Get('list')
  @UseGuards(PlatformAdminGuard)
  @Swagger({
    title: 'Список пользователей (платформенный админ)',
    response: UserResponseDto,
    isArray: true,
    bearerAuth: true,
  })
  list(@Query() query: PaginationQueryDto) {
    return this.userService.list(query);
  }

  @Post('create')
  @UseGuards(PlatformAdminGuard)
  @Swagger({
    title: 'Создать пользователя без пароля (платформенный админ)',
    body: CreateUserDto,
    response: UserResponseDto,
    bearerAuth: true,
  })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get(':id')
  @UseGuards(PlatformAdminGuard)
  @Swagger({
    title: 'Пользователь по id (платформенный админ)',
    param: { name: 'id', type: Number },
    response: UserResponseDto,
    bearerAuth: true,
  })
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findById(id);
  }

  @Post('update/:id')
  @UseGuards(PlatformAdminGuard)
  @Swagger({
    title:
      'Изменить пользователя: профиль и права админа (платформенный админ)',
    param: { name: 'id', type: Number },
    body: UpdateUserDto,
    response: UserResponseDto,
    bearerAuth: true,
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Post('delete/:id')
  @UseGuards(PlatformAdminGuard)
  @Swagger({
    title:
      'Удалить пользователя безвозвратно вместе с его организациями (платформенный админ)',
    param: { name: 'id', type: Number },
    response: UserResponseDto,
    bearerAuth: true,
  })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.userService.delete(id);
  }
}

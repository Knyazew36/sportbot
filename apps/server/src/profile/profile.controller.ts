import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';
import { CleanupStagedUploadsInterceptor } from '@/upload/cleanup-staged-uploads.interceptor';
import { imageUploadInterceptorOptions } from '@/upload/upload.utils';
import { UploadService } from '@/upload/upload.service';

import { CityResponseDto } from './dto/city.response.dto';
import { DeleteProfileDto } from './dto/delete-profile.dto';
import { ProfileResponseDto } from './dto/profile.response.dto';
import { SetTimezoneDto } from './dto/set-timezone.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UploadAvatarDto } from './dto/upload-avatar.dto';
import { ProfileAppService } from './profile-app.service';

@ApiTags('profile')
@Controller('profile')
@SportAuth()
export class ProfileController {
  constructor(
    private readonly profileAppService: ProfileAppService,
    private readonly uploadService: UploadService,
  ) {}

  @Get()
  @Swagger({
    title: 'Профиль: расписание, таймеры, пауза, вес',
    response: ProfileResponseDto,
    bearerAuth: true,
  })
  public view(@CurrentUser('id') userId: number) {
    return this.profileAppService.view(userId);
  }

  @Post('update')
  @Swagger({
    title: 'Изменить настройки профиля',
    body: UpdateProfileDto,
    response: ProfileResponseDto,
    bearerAuth: true,
  })
  public update(
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileAppService.update(userId, dto);
  }

  @Post('avatar')
  @UseInterceptors(
    CleanupStagedUploadsInterceptor,
    FileInterceptor('file', imageUploadInterceptorOptions()),
  )
  @ApiConsumes('multipart/form-data')
  @Swagger({
    title: 'Загрузить своё фото профиля',
    body: UploadAvatarDto,
    response: ProfileResponseDto,
    bearerAuth: true,
  })
  public uploadAvatar(
    @CurrentUser('id') userId: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Файл не передан');
    this.uploadService.verifyImageSignatureOrThrow(file);
    return this.profileAppService.uploadAvatar(userId, file);
  }

  @Post('avatar/delete')
  @Swagger({
    title: 'Удалить фото профиля — останутся инициалы',
    response: ProfileResponseDto,
    bearerAuth: true,
  })
  public removeAvatar(@CurrentUser('id') userId: number) {
    return this.profileAppService.removeAvatar(userId);
  }

  @Get('cities')
  @Swagger({
    title: 'Города для выбора часового пояса',
    response: CityResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public cities() {
    return this.profileAppService.cities();
  }

  @Post('timezone')
  @Swagger({
    title: 'Часовой пояс: город или текущее время',
    body: SetTimezoneDto,
    response: ProfileResponseDto,
    bearerAuth: true,
  })
  public setTimezone(
    @CurrentUser('id') userId: number,
    @Body() dto: SetTimezoneDto,
  ) {
    return this.profileAppService.setTimezone(userId, dto);
  }

  @Post('delete')
  @Swagger({
    title: 'Удалить мои данные (подтверждение словом «удалить»)',
    body: DeleteProfileDto,
    bearerAuth: true,
  })
  public remove(
    @CurrentUser('id') userId: number,
    // Тело проверяется валидацией: без слова «удалить» запрос не дойдёт до сервиса
    @Body() _dto: DeleteProfileDto,
  ) {
    return this.profileAppService.remove(userId);
  }
}

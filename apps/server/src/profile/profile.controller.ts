import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';

import { CityResponseDto } from './dto/city.response.dto';
import { DeleteProfileDto } from './dto/delete-profile.dto';
import { ProfileResponseDto } from './dto/profile.response.dto';
import { SetTimezoneDto } from './dto/set-timezone.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileAppService } from './profile-app.service';

@ApiTags('profile')
@Controller('profile')
@SportAuth()
export class ProfileController {
  constructor(private readonly profileAppService: ProfileAppService) {}

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

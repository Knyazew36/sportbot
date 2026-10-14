import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';

import { BodyWeightService } from './body-weight.service';
import { BodyWeightResponseDto } from './dto/body-weight.response.dto';
import { CreateBodyWeightDto } from './dto/create-body-weight.dto';

// История веса — GET stats/body-weight: там же график
@ApiTags('body-weight')
@Controller('body-weight')
@SportAuth()
export class BodyWeightController {
  constructor(private readonly bodyWeightService: BodyWeightService) {}

  @Post('create')
  @Swagger({
    title: 'Вес тела за сегодня (повторный ввод заменяет)',
    body: CreateBodyWeightDto,
    response: BodyWeightResponseDto,
    bearerAuth: true,
  })
  public create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateBodyWeightDto,
  ) {
    return this.bodyWeightService.recordByUser(userId, dto.value);
  }
}

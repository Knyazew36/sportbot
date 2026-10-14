import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';

import { CreateLimitationDto } from './dto/create-limitation.dto';
import { CreateLimitationResponseDto } from './dto/create-limitation.response.dto';
import { LimitationResponseDto } from './dto/limitation.response.dto';
import { LimitationService } from './limitation.service';

@ApiTags('limitation')
@Controller('limitation')
@SportAuth()
export class LimitationController {
  constructor(private readonly limitationService: LimitationService) {}

  @Get('list')
  @Swagger({
    title: 'Действующие ограничения по суставам',
    response: LimitationResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public list(@CurrentUser('id') userId: number) {
    return this.limitationService.listByUser(userId);
  }

  @Post('create')
  @Swagger({
    title: 'Включить ограничение: зона и срок',
    body: CreateLimitationDto,
    response: CreateLimitationResponseDto,
    bearerAuth: true,
  })
  public create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateLimitationDto,
  ) {
    return this.limitationService.addByUser(
      userId,
      dto.jointId,
      dto.endDate ?? null,
    );
  }

  @Post('delete/:id')
  @Swagger({
    title: 'Снять ограничение',
    param: { name: 'id', type: Number },
    bearerAuth: true,
  })
  public remove(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.limitationService.cancel(userId, id);
  }
}

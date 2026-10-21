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

import { CreateStretchExclusionDto } from './dto/create-stretch-exclusion.dto';
import { StretchExclusionResponseDto } from './dto/stretch-exclusion.response.dto';
import { StretchExclusionService } from './stretch-exclusion.service';

const STRETCH_PARAM = { name: 'stretchId', type: Number };

// Без update: у исключения нет полей, которые можно поменять
@ApiTags('stretch-exclusion')
@Controller('stretch-exclusion')
@SportAuth()
export class StretchExclusionController {
  constructor(private readonly exclusions: StretchExclusionService) {}

  @Get('list')
  @Swagger({
    title: 'Исключённые растяжки: заминка их не предлагает',
    response: StretchExclusionResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public list(@CurrentUser('id') userId: number) {
    return this.exclusions.list(userId);
  }

  @Post('create')
  @Swagger({
    title: 'Исключить растяжку из заминки',
    body: CreateStretchExclusionDto,
    response: StretchExclusionResponseDto,
    bearerAuth: true,
  })
  public create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateStretchExclusionDto,
  ) {
    return this.exclusions.create(userId, dto.stretchId);
  }

  @Post('delete/:stretchId')
  @Swagger({
    title: 'Вернуть растяжку в заминку',
    param: STRETCH_PARAM,
    bearerAuth: true,
  })
  public remove(
    @CurrentUser('id') userId: number,
    @Param('stretchId', ParseIntPipe) stretchId: number,
  ) {
    return this.exclusions.remove(userId, stretchId);
  }

  @Get(':stretchId')
  @Swagger({
    title: 'Исключение растяжки',
    param: STRETCH_PARAM,
    response: StretchExclusionResponseDto,
    bearerAuth: true,
  })
  public find(
    @CurrentUser('id') userId: number,
    @Param('stretchId', ParseIntPipe) stretchId: number,
  ) {
    return this.exclusions.find(userId, stretchId);
  }
}

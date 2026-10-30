import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { PaginationQueryDto } from '@/common/type/pagination-query.dto';
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';

import { CreateStretchSessionDto } from './dto/create-stretch-session.dto';
import { StretchSessionResponseDto } from './dto/stretch-session.response.dto';
import { UpdateStretchSessionDto } from './dto/update-stretch-session.dto';
import { StretchSessionService } from './stretch-session.service';

const ID_PARAM = { name: 'id', type: Number };

@ApiTags('stretch-session')
@Controller('stretch-session')
@SportAuth()
export class StretchSessionController {
  constructor(private readonly sessions: StretchSessionService) {}

  @Post('create')
  @Swagger({
    title: 'Начать занятие растяжкой',
    body: CreateStretchSessionDto,
    response: StretchSessionResponseDto,
    bearerAuth: true,
  })
  public create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateStretchSessionDto,
  ) {
    return this.sessions.create(userId, dto);
  }

  @Get('list')
  @Swagger({
    title: 'Занятия растяжкой',
    query: PaginationQueryDto,
    response: StretchSessionResponseDto,
    isArray: true,
    bearerAuth: true,
  })
  public list(
    @CurrentUser('id') userId: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.sessions.list(userId, query);
  }

  @Get(':id')
  @Swagger({
    title: 'Занятие растяжкой',
    param: ID_PARAM,
    response: StretchSessionResponseDto,
    bearerAuth: true,
  })
  public find(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sessions.find(userId, id);
  }

  @Post('update/:id')
  @Swagger({
    title: 'Отметить занятие пройденным',
    param: ID_PARAM,
    body: UpdateStretchSessionDto,
    response: StretchSessionResponseDto,
    bearerAuth: true,
  })
  public update(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStretchSessionDto,
  ) {
    return this.sessions.update(userId, id, dto);
  }

  @Post('delete/:id')
  @Swagger({
    title: 'Удалить занятие',
    param: ID_PARAM,
    bearerAuth: true,
  })
  public remove(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sessions.remove(userId, id);
  }
}

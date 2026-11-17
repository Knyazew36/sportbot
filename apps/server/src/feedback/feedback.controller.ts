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
import { PaginationQueryDto } from '@/common/type';
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';

import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackResponseDto } from './dto/feedback.response.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { FeedbackService } from './feedback.service';

const ID_PARAM = { name: 'id', type: Number };

@ApiTags('feedback')
@Controller('feedback')
@SportAuth()
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Post('create')
  @Swagger({
    title: 'Отправить идею или сообщить о проблеме',
    body: CreateFeedbackDto,
    response: FeedbackResponseDto,
    bearerAuth: true,
  })
  public create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedback.create(userId, dto);
  }

  @Get('list')
  @Swagger({
    title: 'Мои обращения',
    query: PaginationQueryDto,
    response: FeedbackResponseDto,
    isArray: true,
    bearerAuth: true,
  })
  public list(
    @CurrentUser('id') userId: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.feedback.list(userId, query);
  }

  @Post('update/:id')
  @Swagger({
    title: 'Поправить обращение, пока на него не ответили',
    param: ID_PARAM,
    body: UpdateFeedbackDto,
    response: FeedbackResponseDto,
    bearerAuth: true,
  })
  public update(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFeedbackDto,
  ) {
    return this.feedback.update(userId, id, dto);
  }

  @Post('delete/:id')
  @Swagger({
    title: 'Удалить своё обращение',
    param: ID_PARAM,
    bearerAuth: true,
  })
  public remove(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.feedback.remove(userId, id);
  }

  @Get(':id')
  @Swagger({
    title: 'Обращение с ответами команды',
    param: ID_PARAM,
    response: FeedbackResponseDto,
    bearerAuth: true,
  })
  public find(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.feedback.find(userId, id);
  }
}

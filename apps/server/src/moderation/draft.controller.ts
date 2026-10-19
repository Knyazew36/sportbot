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
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';

import { DraftAppService } from './draft-app.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { MyEntriesQueryDto } from './dto/my-entries-query.dto';
import { MyEntryResponseDto } from './dto/my-entry.response.dto';

const ID_PARAM = { name: 'id', description: 'ID своей записи' };

@ApiTags('drafts')
@Controller('drafts')
@SportAuth()
export class DraftController {
  constructor(private readonly draftAppService: DraftAppService) {}

  @Get('mine')
  @Swagger({
    title: 'Мои записи со статусами публикации',
    query: MyEntriesQueryDto,
    response: MyEntryResponseDto,
    isArray: true,
    bearerAuth: true,
  })
  public mine(
    @CurrentUser('id') userId: number,
    @Query() query: MyEntriesQueryDto,
  ) {
    return this.draftAppService.mine(userId, query);
  }

  @Post('create')
  @Swagger({
    title: 'Своё упражнение или растяжка: личная запись без проверки',
    body: CreateDraftDto,
    response: MyEntryResponseDto,
    bearerAuth: true,
  })
  public create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateDraftDto,
  ) {
    return this.draftAppService.create(userId, dto);
  }

  @Post('exercises/publish/:id')
  @Swagger({
    title: 'Отправить своё упражнение на проверку в общий справочник',
    param: ID_PARAM,
    bearerAuth: true,
  })
  public publishExercise(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.draftAppService.publish(userId, 'exercise', id);
  }

  @Post('stretches/publish/:id')
  @Swagger({
    title: 'Отправить свою растяжку на проверку в общий справочник',
    param: ID_PARAM,
    bearerAuth: true,
  })
  public publishStretch(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.draftAppService.publish(userId, 'stretch', id);
  }
}

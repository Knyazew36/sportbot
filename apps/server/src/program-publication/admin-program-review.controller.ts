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

import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { SportAdmin } from '@/miniapp/decorators/sport-auth.decorator';

import { ProgramReviewListItemResponseDto } from './dto/program-review-list-item.response.dto';
import { ProgramReviewResponseDto } from './dto/program-review.response.dto';
import { ProgramReviewsQueryDto } from './dto/program-reviews-query.dto';
import { RejectProgramDto } from './dto/reject-program.dto';
import { ReplaceProgramTagDto } from './dto/replace-program-tag.dto';
import { ProgramPublicationService } from './program-publication.service';

const ID_PARAM = { name: 'id', type: Number };
const TAG_PARAM = { name: 'id', type: Number, description: 'Свой тег автора' };

/** Проверка программ пользователей перед каталогом «Программы пользователей». */
@ApiTags('admin-program-reviews')
@Controller('admin/program-reviews')
@SportAdmin()
export class AdminProgramReviewController {
  constructor(private readonly publication: ProgramPublicationService) {}

  // ── Программы ───────────────────────────────────────────────────────────

  @Get('list')
  @Swagger({
    title:
      'Программы пользователей: очередь на проверку или опубликованные в каталоге',
    query: ProgramReviewsQueryDto,
    response: ProgramReviewListItemResponseDto,
    isArray: true,
    bearerAuth: true,
  })
  public list(@Query() query: ProgramReviewsQueryDto) {
    return this.publication.queue(query);
  }

  @Get(':id')
  @Swagger({
    title: 'Программа на проверке: текст, теги, состав',
    param: ID_PARAM,
    response: ProgramReviewResponseDto,
    bearerAuth: true,
  })
  public one(@Param('id', ParseIntPipe) id: number) {
    return this.publication.one(id);
  }

  @Post('approve/:id')
  @Swagger({
    title: 'Одобрить: текущие название и описание уходят в каталог',
    param: ID_PARAM,
    response: ProgramReviewResponseDto,
    bearerAuth: true,
  })
  public approve(@Param('id', ParseIntPipe) id: number) {
    return this.publication.approve(id);
  }

  @Post('reject/:id')
  @Swagger({
    title: 'Отклонить публикацию или правку текста с причиной',
    param: ID_PARAM,
    body: RejectProgramDto,
    response: ProgramReviewResponseDto,
    bearerAuth: true,
  })
  public reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectProgramDto,
  ) {
    return this.publication.reject(id, dto.reason);
  }

  @Post('take-down/:id')
  @Swagger({
    title: 'Снять опубликованную программу из каталога с причиной',
    param: ID_PARAM,
    body: RejectProgramDto,
    response: ProgramReviewResponseDto,
    bearerAuth: true,
  })
  public takeDown(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectProgramDto,
  ) {
    return this.publication.takeDown(id, dto.reason);
  }

  @Post('delete/:id')
  @Swagger({
    title:
      'Удалить программу пользователя совсем с причиной: копии у взявших остаются',
    param: ID_PARAM,
    body: RejectProgramDto,
    bearerAuth: true,
  })
  public remove(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectProgramDto,
  ) {
    return this.publication.remove(id, dto.reason);
  }

  // ── Свои теги ───────────────────────────────────────────────────────────

  @Post('tag/approve/:id')
  @Swagger({
    title: 'Одобрить свой тег автора: он входит в справочник',
    param: TAG_PARAM,
    bearerAuth: true,
  })
  public approveTag(@Param('id', ParseIntPipe) id: number) {
    return this.publication.approveTag(id);
  }

  @Post('tag/replace/:id')
  @Swagger({
    title: 'Заменить свой тег автора тегом справочника той же группы',
    param: TAG_PARAM,
    body: ReplaceProgramTagDto,
    bearerAuth: true,
  })
  public replaceTag(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplaceProgramTagDto,
  ) {
    return this.publication.replaceTag(id, dto.targetId);
  }

  @Post('tag/reject/:id')
  @Swagger({
    title: 'Отклонить свой тег автора: он снимается с программы',
    param: TAG_PARAM,
    bearerAuth: true,
  })
  public rejectTag(@Param('id', ParseIntPipe) id: number) {
    return this.publication.rejectTag(id);
  }
}

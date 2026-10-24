import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { PaginationQueryDto } from '@/common/type/pagination-query.dto';
import { SportAdmin } from '@/miniapp/decorators/sport-auth.decorator';

import { AdminAppService } from './admin-app.service';
import { AdminComplaintResponseDto } from './dto/admin-complaint.response.dto';
import { AdminComplaintsQueryDto } from './dto/admin-complaints-query.dto';
import { AdminCountersResponseDto } from './dto/admin-counters.response.dto';
import { AdminRequestResponseDto } from './dto/admin-request.response.dto';
import { AdminStatsResponseDto } from './dto/admin-stats.response.dto';
import { AdminUserResponseDto } from './dto/admin-user.response.dto';
import { AdminUserDetailResponseDto } from './dto/admin-user-detail.response.dto';
import { ApproveRequestDto } from './dto/approve-request.dto';
import { CloseComplaintDto } from './dto/close-complaint.dto';
import { DuplicateRequestDto } from './dto/duplicate-request.dto';
import { ImportFileDto } from './dto/import-file.dto';
import { ImportReportResponseDto } from './dto/import-report.response.dto';
import { RejectRequestDto } from './dto/reject-request.dto';

const ID_PARAM = { name: 'id', type: Number };
// Файл импорта читается из памяти: это JSON, на диск его класть незачем
const IMPORT_UPLOAD = FileInterceptor('file', {
  limits: { fileSize: 5 * 1024 * 1024 },
});

const fileText = (file?: Express.Multer.File): string => {
  if (!file) throw new BadRequestException('Файл не передан');
  return file.buffer.toString('utf-8');
};

@ApiTags('admin')
@Controller('admin')
@SportAdmin()
export class AdminController {
  constructor(private readonly adminAppService: AdminAppService) {}

  @Get('counters')
  @Swagger({
    title: 'Счётчики: пользователи, тренировки, заявки, жалобы',
    response: AdminCountersResponseDto,
    bearerAuth: true,
  })
  public counters() {
    return this.adminAppService.counters();
  }

  @Get('stats')
  @Swagger({
    title: 'Обзор: пользователи, активность, ряд по дням за 30 дней',
    response: AdminStatsResponseDto,
    bearerAuth: true,
  })
  public stats() {
    return this.adminAppService.stats();
  }

  // ── Модерация ───────────────────────────────────────────────────────────

  @Get('moderation')
  @Swagger({
    title: 'Очередь заявок на модерацию',
    query: PaginationQueryDto,
    response: AdminRequestResponseDto,
    isArray: true,
    bearerAuth: true,
  })
  public requests(@Query() query: PaginationQueryDto) {
    return this.adminAppService.requests(query);
  }

  @Get('moderation/:id')
  @Swagger({
    title: 'Заявка: запись и похожие записи справочника',
    param: ID_PARAM,
    response: AdminRequestResponseDto,
    bearerAuth: true,
  })
  public request(@Param('id', ParseIntPipe) id: number) {
    return this.adminAppService.request(id);
  }

  @Post('moderation/approve/:id')
  @Swagger({
    title: 'Одобрить заявку (с правками, если переданы поля)',
    param: ID_PARAM,
    body: ApproveRequestDto,
    response: AdminRequestResponseDto,
    bearerAuth: true,
  })
  public approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveRequestDto,
  ) {
    return this.adminAppService.approve(id, dto);
  }

  @Post('moderation/duplicate/:id')
  @Swagger({
    title: 'Заявка — дубль существующей записи',
    param: ID_PARAM,
    body: DuplicateRequestDto,
    response: AdminRequestResponseDto,
    bearerAuth: true,
  })
  public duplicate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DuplicateRequestDto,
  ) {
    return this.adminAppService.duplicate(id, dto.targetId, dto.reason);
  }

  @Post('moderation/reject/:id')
  @Swagger({
    title: 'Отклонить заявку с причиной',
    param: ID_PARAM,
    body: RejectRequestDto,
    response: AdminRequestResponseDto,
    bearerAuth: true,
  })
  public reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectRequestDto,
  ) {
    return this.adminAppService.reject(id, dto.reason);
  }

  // ── Жалобы ──────────────────────────────────────────────────────────────

  @Get('complaints')
  @Swagger({
    title: 'Жалобы на описания',
    query: AdminComplaintsQueryDto,
    response: AdminComplaintResponseDto,
    isArray: true,
    bearerAuth: true,
  })
  public complaints(@Query() query: AdminComplaintsQueryDto) {
    return this.adminAppService.complaints(query);
  }

  @Post('complaints/close/:id')
  @Swagger({
    title: 'Закрыть жалобу: исправлено или отклонено',
    param: ID_PARAM,
    body: CloseComplaintDto,
    bearerAuth: true,
  })
  public closeComplaint(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloseComplaintDto,
  ) {
    return this.adminAppService.closeComplaint(id, dto.status, dto.reason);
  }

  @Post('complaints/apply/:id')
  @Swagger({
    title: 'Применить правку упражнения как есть и закрыть жалобу',
    param: ID_PARAM,
    bearerAuth: true,
  })
  public applyComplaint(@Param('id', ParseIntPipe) id: number) {
    return this.adminAppService.applyComplaint(id);
  }

  // ── Пользователи ────────────────────────────────────────────────────────

  @Get('users')
  @Swagger({
    title: 'Пользователи с поиском',
    query: PaginationQueryDto,
    response: AdminUserResponseDto,
    isArray: true,
    bearerAuth: true,
  })
  public users(@Query() query: PaginationQueryDto) {
    return this.adminAppService.users(query);
  }

  @Get('users/:id')
  @Swagger({
    title: 'Карточка пользователя: профиль и активность',
    param: ID_PARAM,
    response: AdminUserDetailResponseDto,
    bearerAuth: true,
  })
  public user(@Param('id', ParseIntPipe) id: number) {
    return this.adminAppService.user(id);
  }

  @Post('users/block/:id')
  @Swagger({
    title: 'Заблокировать пользователя',
    param: ID_PARAM,
    bearerAuth: true,
  })
  public block(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminAppService.block(adminId, id);
  }

  @Post('users/unblock/:id')
  @Swagger({
    title: 'Разблокировать пользователя',
    param: ID_PARAM,
    bearerAuth: true,
  })
  public unblock(@Param('id', ParseIntPipe) id: number) {
    return this.adminAppService.unblock(id);
  }

  // ── Импорт ──────────────────────────────────────────────────────────────

  @Post('import/check')
  @UseInterceptors(IMPORT_UPLOAD)
  @ApiConsumes('multipart/form-data')
  @Swagger({
    title: 'Проверить файл импорта без записи',
    body: ImportFileDto,
    response: ImportReportResponseDto,
    bearerAuth: true,
  })
  public importCheck(@UploadedFile() file?: Express.Multer.File) {
    return this.adminAppService.importCheck(fileText(file));
  }

  @Post('import/apply')
  @UseInterceptors(IMPORT_UPLOAD)
  @ApiConsumes('multipart/form-data')
  @Swagger({
    title: 'Применить файл импорта',
    body: ImportFileDto,
    response: ImportReportResponseDto,
    bearerAuth: true,
  })
  public importApply(@UploadedFile() file?: Express.Multer.File) {
    return this.adminAppService.importApply(fileText(file));
  }
}

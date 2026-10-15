import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { SportAdmin } from '@/miniapp/decorators/sport-auth.decorator';
import { ReorderDto } from '@/program/dto/reorder.dto';

import { AdminProgramTagResponseDto } from './dto/admin-program-tag.response.dto';
import { CreateProgramTagDto } from './dto/create-program-tag.dto';
import { UpdateProgramTagDto } from './dto/update-program-tag.dto';
import { ProgramTagService } from './program-tag.service';

const ID_PARAM = { name: 'id', type: Number };

/** Теги шаблонов программ (админка): чипы-фильтры каталога и онбординга. */
@ApiTags('admin-program-tags')
@Controller('admin/program-tags')
@SportAdmin()
export class ProgramTagController {
  constructor(private readonly programTagService: ProgramTagService) {}

  @Get('list')
  @Swagger({
    title: 'Теги шаблонов',
    response: AdminProgramTagResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public list() {
    return this.programTagService.list();
  }

  @Post('create')
  @Swagger({
    title: 'Новый тег',
    body: CreateProgramTagDto,
    response: AdminProgramTagResponseDto,
    bearerAuth: true,
  })
  public create(@Body() dto: CreateProgramTagDto) {
    return this.programTagService.create(dto);
  }

  @Post('reorder')
  @Swagger({
    title: 'Порядок тегов внутри группы',
    body: ReorderDto,
    response: AdminProgramTagResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public reorder(@Body() dto: ReorderDto) {
    return this.programTagService.reorder(dto.ids);
  }

  @Post('update/:id')
  @Swagger({
    title: 'Изменить тег',
    param: ID_PARAM,
    body: UpdateProgramTagDto,
    response: AdminProgramTagResponseDto,
    bearerAuth: true,
  })
  public update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProgramTagDto,
  ) {
    return this.programTagService.update(id, dto);
  }

  @Post('delete/:id')
  @Swagger({ title: 'Удалить тег', param: ID_PARAM, bearerAuth: true })
  public remove(@Param('id', ParseIntPipe) id: number) {
    return this.programTagService.remove(id);
  }

  @Get(':id')
  @Swagger({
    title: 'Тег',
    param: ID_PARAM,
    response: AdminProgramTagResponseDto,
    bearerAuth: true,
  })
  public one(@Param('id', ParseIntPipe) id: number) {
    return this.programTagService.one(id);
  }
}

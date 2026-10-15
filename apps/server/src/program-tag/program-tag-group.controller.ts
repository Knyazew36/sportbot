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

import { AdminProgramTagGroupResponseDto } from './dto/admin-program-tag-group.response.dto';
import { CreateProgramTagGroupDto } from './dto/create-program-tag-group.dto';
import { UpdateProgramTagGroupDto } from './dto/update-program-tag-group.dto';
import { ProgramTagGroupService } from './program-tag-group.service';

const ID_PARAM = { name: 'id', type: Number };

/** Группы тегов шаблонов (админка): ряды чипов каталога — «Где», «Уровень», «Цель». */
@ApiTags('admin-program-tag-groups')
@Controller('admin/program-tag-groups')
@SportAdmin()
export class ProgramTagGroupController {
  constructor(
    private readonly programTagGroupService: ProgramTagGroupService,
  ) {}

  @Get('list')
  @Swagger({
    title: 'Группы тегов с тегами',
    response: AdminProgramTagGroupResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public list() {
    return this.programTagGroupService.list();
  }

  @Post('create')
  @Swagger({
    title: 'Новая группа тегов',
    body: CreateProgramTagGroupDto,
    response: AdminProgramTagGroupResponseDto,
    bearerAuth: true,
  })
  public create(@Body() dto: CreateProgramTagGroupDto) {
    return this.programTagGroupService.create(dto);
  }

  @Post('reorder')
  @Swagger({
    title: 'Порядок групп тегов',
    body: ReorderDto,
    response: AdminProgramTagGroupResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public reorder(@Body() dto: ReorderDto) {
    return this.programTagGroupService.reorder(dto.ids);
  }

  @Post('update/:id')
  @Swagger({
    title: 'Изменить группу тегов',
    param: ID_PARAM,
    body: UpdateProgramTagGroupDto,
    response: AdminProgramTagGroupResponseDto,
    bearerAuth: true,
  })
  public update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProgramTagGroupDto,
  ) {
    return this.programTagGroupService.update(id, dto);
  }

  @Post('delete/:id')
  @Swagger({
    title: 'Удалить пустую группу тегов',
    param: ID_PARAM,
    bearerAuth: true,
  })
  public remove(@Param('id', ParseIntPipe) id: number) {
    return this.programTagGroupService.remove(id);
  }

  @Get(':id')
  @Swagger({
    title: 'Группа тегов',
    param: ID_PARAM,
    response: AdminProgramTagGroupResponseDto,
    bearerAuth: true,
  })
  public one(@Param('id', ParseIntPipe) id: number) {
    return this.programTagGroupService.one(id);
  }
}

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

import { CreateStretchRoutineDto } from './dto/create-stretch-routine.dto';
import { StretchRoutineResponseDto } from './dto/stretch-routine.response.dto';
import { UpdateStretchRoutineDto } from './dto/update-stretch-routine.dto';
import { StretchRoutineService } from './stretch-routine.service';

const ID_PARAM = { name: 'id', type: Number };

@ApiTags('admin-stretch-routine')
@Controller('admin/stretch-routine')
@SportAdmin()
export class AdminStretchRoutineController {
  constructor(private readonly routines: StretchRoutineService) {}

  @Post('create')
  @Swagger({
    title: 'Создать комплекс растяжек',
    body: CreateStretchRoutineDto,
    response: StretchRoutineResponseDto,
    bearerAuth: true,
  })
  public create(@Body() dto: CreateStretchRoutineDto) {
    return this.routines.create(dto);
  }

  @Get('list')
  @Swagger({
    title: 'Все комплексы растяжек, включая скрытые',
    response: StretchRoutineResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public list() {
    return this.routines.list(false);
  }

  @Get(':id')
  @Swagger({
    title: 'Комплекс растяжек, в том числе скрытый',
    param: ID_PARAM,
    response: StretchRoutineResponseDto,
    bearerAuth: true,
  })
  public find(@Param('id', ParseIntPipe) id: number) {
    return this.routines.find(id, false);
  }

  @Post('update/:id')
  @Swagger({
    title: 'Изменить комплекс растяжек',
    param: ID_PARAM,
    body: UpdateStretchRoutineDto,
    response: StretchRoutineResponseDto,
    bearerAuth: true,
  })
  public update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStretchRoutineDto,
  ) {
    return this.routines.update(id, dto);
  }

  @Post('delete/:id')
  @Swagger({
    title: 'Удалить комплекс растяжек',
    param: ID_PARAM,
    bearerAuth: true,
  })
  public remove(@Param('id', ParseIntPipe) id: number) {
    return this.routines.remove(id);
  }
}

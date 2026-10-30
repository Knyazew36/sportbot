import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';

import { StretchRoutineResponseDto } from './dto/stretch-routine.response.dto';
import { StretchRoutineService } from './stretch-routine.service';

const ID_PARAM = { name: 'id', type: Number };

// Правит только админ: admin-stretch-routine.controller
@ApiTags('stretch-routine')
@Controller('stretch-routine')
@SportAuth()
export class StretchRoutineController {
  constructor(private readonly routines: StretchRoutineService) {}

  @Get('list')
  @Swagger({
    title: 'Готовые комплексы растяжек',
    response: StretchRoutineResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public list() {
    return this.routines.list(true);
  }

  @Get(':id')
  @Swagger({
    title: 'Комплекс растяжек',
    param: ID_PARAM,
    response: StretchRoutineResponseDto,
    bearerAuth: true,
  })
  public find(@Param('id', ParseIntPipe) id: number) {
    return this.routines.find(id, true);
  }
}

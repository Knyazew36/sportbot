import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';

import { PauseEndResponseDto } from './dto/pause-end.response.dto';
import { PauseResponseDto } from './dto/pause.response.dto';
import { StartPauseDto } from './dto/start-pause.dto';
import { PauseService } from './pause.service';

@ApiTags('pause')
@Controller('pause')
@SportAuth()
export class PauseController {
  constructor(private readonly pauseService: PauseService) {}

  @Post('start')
  @Swagger({
    title:
      'Поставить паузу «до даты» или «до отмены» (действующая продлевается)',
    body: StartPauseDto,
    response: PauseResponseDto,
    bearerAuth: true,
  })
  public start(@CurrentUser('id') userId: number, @Body() dto: StartPauseDto) {
    return this.pauseService.startByUser(userId, dto.endDate ?? null);
  }

  @Post('end')
  @Swagger({
    title: 'Снять паузу досрочно или вернуться после её срока',
    response: PauseEndResponseDto,
    bearerAuth: true,
  })
  public async end(
    @CurrentUser('id') userId: number,
  ): Promise<PauseEndResponseDto> {
    return { ended: await this.pauseService.endByUser(userId) };
  }
}

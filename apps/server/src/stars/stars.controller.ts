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
import { BotChannel, User } from '@/generated/prisma/client';
import { AuthChannel } from '@/miniapp/decorators/auth-channel.decorator';
import {
  SportAdmin,
  SportAuth,
} from '@/miniapp/decorators/sport-auth.decorator';

import { CreateStarPaymentDto } from './dto/create-star-payment.dto';
import { StarInvoiceResponseDto } from './dto/star-invoice.response.dto';
import { StarPaymentQueryDto } from './dto/star-payment-query.dto';
import { StarPaymentResponseDto } from './dto/star-payment.response.dto';
import { StarsService } from './stars.service';

const ID_PARAM = { name: 'id', type: Number };

// Платёж — финансовая запись: меняют его только события Telegram и возврат,
// поэтому update/delete-эндпоинтов нет намеренно
@ApiTags('stars')
@Controller('stars')
export class StarsController {
  constructor(private readonly starsService: StarsService) {}

  @Post('create')
  @SportAuth()
  @Swagger({
    title: 'Выставить счёт в звёздах Telegram (только Mini App в Telegram)',
    body: CreateStarPaymentDto,
    response: StarInvoiceResponseDto,
    bearerAuth: true,
  })
  public create(
    @CurrentUser() user: User,
    @AuthChannel() channel: BotChannel | null,
    @Body() dto: CreateStarPaymentDto,
  ) {
    return this.starsService.create(user, channel, dto);
  }

  @Get('list')
  @SportAdmin()
  @Swagger({
    title: 'Платежи звёздами (админ)',
    response: StarPaymentResponseDto,
    isArray: true,
    query: StarPaymentQueryDto,
    bearerAuth: true,
  })
  public list(@Query() query: StarPaymentQueryDto) {
    return this.starsService.list(query);
  }

  @Get(':id')
  @SportAuth()
  @Swagger({
    title: 'Платёж звёздами: свой — любому, чужой — админу',
    param: ID_PARAM,
    response: StarPaymentResponseDto,
    bearerAuth: true,
  })
  public findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.starsService.findOne(user, id);
  }

  @Post('refund/:id')
  @SportAdmin()
  @Swagger({
    title: 'Вернуть звёзды за оплаченный платёж (админ)',
    param: ID_PARAM,
    response: StarPaymentResponseDto,
    bearerAuth: true,
  })
  public refund(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.starsService.refund(id, adminId);
  }
}

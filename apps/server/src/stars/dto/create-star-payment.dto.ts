import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, Max, Min } from 'class-validator';

import {
  STAR_AMOUNT_MAX,
  STAR_AMOUNT_MIN,
  STAR_PAYMENT_PURPOSES,
  type StarPaymentPurpose,
} from '../stars.constants';

export class CreateStarPaymentDto {
  @ApiProperty({
    example: 100,
    minimum: STAR_AMOUNT_MIN,
    maximum: STAR_AMOUNT_MAX,
    description: 'Сумма в звёздах',
  })
  @IsInt({ message: 'Сумма — целое число звёзд' })
  @Min(STAR_AMOUNT_MIN, { message: `Минимум ${STAR_AMOUNT_MIN} звезда` })
  @Max(STAR_AMOUNT_MAX, { message: `Максимум ${STAR_AMOUNT_MAX} звёзд` })
  amount: number;

  @ApiProperty({
    enum: STAR_PAYMENT_PURPOSES,
    enumName: 'StarPaymentPurpose',
    example: 'donation',
  })
  @IsIn(STAR_PAYMENT_PURPOSES, { message: 'Неизвестное назначение платежа' })
  purpose: StarPaymentPurpose;
}

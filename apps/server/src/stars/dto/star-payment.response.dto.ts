import { ApiProperty } from '@nestjs/swagger';

import { StarPaymentStatus } from '@/generated/prisma/client';

import {
  STAR_PAYMENT_PURPOSES,
  type StarPaymentPurpose,
} from '../stars.constants';

export class StarPaymentResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty({ description: 'Сумма в звёздах' })
  amount: number;

  @ApiProperty({
    enum: STAR_PAYMENT_PURPOSES,
    enumName: 'StarPaymentPurpose',
  })
  purpose: StarPaymentPurpose;

  @ApiProperty({ enum: StarPaymentStatus, enumName: 'StarPaymentStatus' })
  status: StarPaymentStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  paidAt: Date | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  refundedAt: Date | null;
}

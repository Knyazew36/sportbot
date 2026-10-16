import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { BotChannel } from '@/generated/prisma/client';

export class AvatarFromMessengerDto {
  @ApiProperty({
    enum: BotChannel,
    description: 'Из какого привязанного мессенджера взять фото',
  })
  @IsEnum(BotChannel)
  messenger: BotChannel;
}

import { ApiProperty } from '@nestjs/swagger';

import { FriendProgramResponseDto } from './friend-program.response.dto';

export class FriendProfileResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  displayName: string;

  @ApiProperty()
  currentStreak: number;

  @ApiProperty()
  bestStreak: number;

  @ApiProperty()
  paused: boolean;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Пауза до; null — до отмены или паузы нет',
  })
  pauseEndDate: string | null;

  @ApiProperty({ type: [FriendProgramResponseDto] })
  programs: FriendProgramResponseDto[];
}

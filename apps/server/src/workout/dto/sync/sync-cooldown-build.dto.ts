import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from 'class-validator';

import { SyncCooldownStretchDto } from './sync-cooldown-stretch.dto';

/** cooldown.build: заминка, собранная на телефоне. clientId операции — тренировка. */
export class SyncCooldownBuildDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SyncCooldownStretchDto)
  stretches: SyncCooldownStretchDto[];
}

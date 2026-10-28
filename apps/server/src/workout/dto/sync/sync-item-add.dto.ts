import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';

import { SyncNewItemDto } from './sync-new-item.dto';

/** item.add: ещё упражнения в тренировку. clientId операции — тренировка. */
export class SyncItemAddDto {
  @IsBoolean()
  inComplex: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SyncNewItemDto)
  items: SyncNewItemDto[];
}

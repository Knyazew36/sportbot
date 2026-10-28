import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { SyncComplexNewItemDto } from './sync-complex-new-item.dto';

/** complexItem.add: подбор из справочника; clientId операции — комплекс. */
export class SyncComplexItemsAddDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SyncComplexNewItemDto)
  items: SyncComplexNewItemDto[];

  /** Встать в суперсет этого упражнения */
  @IsOptional()
  @IsUUID()
  joinItemClientId?: string;

  /** Собрать выбранные в новый суперсет */
  @IsOptional()
  @IsBoolean()
  newSuperset?: boolean;
}

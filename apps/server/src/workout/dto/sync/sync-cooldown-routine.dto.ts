import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class SyncCooldownRoutineRowDto {
  @IsUUID()
  clientId: string;

  @IsInt()
  stretchId: number;

  @IsInt()
  position: number;
}

/** cooldown.routine: готовый комплекс вместо набора заминки; состав выбрал телефон. */
export class SyncCooldownRoutineDto {
  @IsInt()
  routineId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SyncCooldownRoutineRowDto)
  stretches: SyncCooldownRoutineRowDto[];
}

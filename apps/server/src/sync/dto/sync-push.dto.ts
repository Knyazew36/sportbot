import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsISO8601,
  IsObject,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Пачка операций за раз — столько же шлёт клиент. */
export const SYNC_PUSH_LIMIT = 50;

export class SyncOpDto {
  @ApiProperty({
    description: 'uuid операции: повтор с тем же opId вернёт прошлый результат',
  })
  @IsUUID()
  opId: string;

  @ApiProperty({ example: 'set.add', description: 'Тип операции' })
  @IsString()
  @MaxLength(64)
  type: string;

  @ApiProperty({
    description: 'clientId строки, которую создаёт или меняет операция',
  })
  @IsUUID()
  clientId: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Поля операции — свои у каждого type',
  })
  @IsObject()
  payload: Record<string, unknown>;

  @ApiProperty({
    description:
      'Когда действие сделано на телефоне (ISO). Время подходов и тренировки берётся отсюда',
  })
  @IsISO8601()
  at: string;
}

export class SyncPushDto {
  @ApiProperty({
    type: [SyncOpDto],
    description: `Операции строго в порядке действий, не больше ${SYNC_PUSH_LIMIT}`,
  })
  @IsArray()
  @ArrayMaxSize(SYNC_PUSH_LIMIT)
  @ValidateNested({ each: true })
  @Type(() => SyncOpDto)
  ops: SyncOpDto[];
}

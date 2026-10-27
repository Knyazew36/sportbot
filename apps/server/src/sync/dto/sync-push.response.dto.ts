import { ApiProperty } from '@nestjs/swagger';

export const SYNC_OP_STATUSES = ['applied', 'skipped', 'rejected'] as const;
export type SyncOpStatus = (typeof SYNC_OP_STATUSES)[number];

export class SyncOpResultDto {
  @ApiProperty()
  opId: string;

  @ApiProperty({
    enum: SYNC_OP_STATUSES,
    enumName: 'SyncOpStatus',
    description:
      'applied — применена; skipped — уже не нужна (объект удалён), клиенту не откатывать; rejected — отклонена, клиент откатывает её у себя',
  })
  status: SyncOpStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Почему skipped или rejected — текст для плашки',
  })
  reason: string | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    nullable: true,
    description: 'Серверные id созданных строк: { clientId: id }',
  })
  ids: Record<string, number> | null;
}

export class SyncPushResponseDto {
  @ApiProperty({
    type: [SyncOpResultDto],
    description:
      'По одной на операцию, в том же порядке. После первой rejected остальные не применяются',
  })
  results: SyncOpResultDto[];
}

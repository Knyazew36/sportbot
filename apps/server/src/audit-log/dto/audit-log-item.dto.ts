import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'invite.create', description: '"<entity>.<verb>"' })
  action: string;

  @ApiProperty({ example: 'invite' })
  entity: string;

  @ApiPropertyOptional({ type: Number, nullable: true })
  entityId: number | null;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    description: 'Тело запроса на момент действия (санитизировано)',
  })
  payload: unknown;

  @ApiPropertyOptional({ type: Number, nullable: true })
  userId: number | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Имя автора на текущий момент (может отличаться от снимка)',
  })
  userDisplayName: string | null;

  @ApiProperty()
  createdAt: Date;
}

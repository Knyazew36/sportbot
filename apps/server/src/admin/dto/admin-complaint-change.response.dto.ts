import { ApiProperty } from '@nestjs/swagger';

const FIELDS = [
  'name',
  'technique',
  'steps',
  'mistakes',
  'videoUrl',
  'equipment',
  'imagePath',
  'measure',
  'primary',
  'secondary',
  'jointIds',
  'howTo',
  'holdSeconds',
  'perSide',
  'muscles',
] as const;

/** Одно поле правки: «было → стало». У картинки значения — адреса файлов. */
export class AdminComplaintChangeResponseDto {
  @ApiProperty({ enum: FIELDS })
  field: (typeof FIELDS)[number];

  @ApiProperty({ example: 'Название' })
  title: string;

  @ApiProperty({ type: String, nullable: true })
  before: string | null;

  @ApiProperty({ type: String, nullable: true })
  after: string | null;
}

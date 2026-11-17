import { ApiProperty } from '@nestjs/swagger'

export class SupportPageMetaDto {
  @ApiProperty()
  public total: number

  @ApiProperty()
  public page: number

  @ApiProperty()
  public limit: number

  @ApiProperty()
  public totalPages: number

  @ApiProperty()
  public hasNextPage: boolean

  @ApiProperty()
  public hasPrevPage: boolean
}

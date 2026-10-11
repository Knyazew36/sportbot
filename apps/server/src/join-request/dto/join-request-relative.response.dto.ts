import { ApiProperty } from '@nestjs/swagger'

/** Родственник заявителя (родитель или ребёнок) в карточке заявки. */
export class JoinRequestRelativeResponseDto {
  @ApiProperty({ description: 'ID пользователя' })
  userId: number

  @ApiProperty({ type: String, description: 'Имя', nullable: true })
  name: string | null

  @ApiProperty({ type: String, description: 'Фамилия', nullable: true })
  lastName: string | null

  @ApiProperty({ type: String, description: 'Email', nullable: true })
  email: string | null

  @ApiProperty({ type: String, description: 'Телефон', nullable: true })
  phone: string | null

  @ApiProperty({ type: String, description: 'Аватар', nullable: true })
  avatarUrl: string | null

  @ApiProperty({ type: Date, description: 'Дата рождения', nullable: true })
  birthDate: Date | null
}

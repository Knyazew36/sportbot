import { ApiProperty } from '@nestjs/swagger';

/** Подпись под фото: открытые лицензии (CC BY, CC BY-SA) требуют автора и ссылку. */
export class StretchImageCreditResponseDto {
  @ApiProperty({ type: String, nullable: true, description: 'Страница источника' })
  source: string | null;

  @ApiProperty({ description: 'Лицензия: CC BY-SA 4.0, Unlicense…' })
  license: string;

  @ApiProperty({ type: String, nullable: true })
  author: string | null;
}

/** null — у фото нет записанной лицензии, подпись не показываем. */
export const stretchImageCredit = (stretch: {
  imageSource: string | null;
  imageLicense: string | null;
  imageAuthor: string | null;
}): StretchImageCreditResponseDto | null =>
  stretch.imageLicense
    ? {
        source: stretch.imageSource,
        license: stretch.imageLicense,
        author: stretch.imageAuthor,
      }
    : null;

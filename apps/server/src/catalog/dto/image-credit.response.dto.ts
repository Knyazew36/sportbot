import { ApiProperty } from '@nestjs/swagger';

/** Подпись под фото: открытые лицензии (CC BY, CC BY-SA) требуют автора и ссылку. */
export class ImageCreditResponseDto {
  @ApiProperty({ type: String, nullable: true, description: 'Страница источника' })
  source: string | null;

  @ApiProperty({ description: 'Лицензия: CC BY-SA 4.0, Unlicense…' })
  license: string;

  @ApiProperty({ type: String, nullable: true })
  author: string | null;
}

/** Поля атрибуции фото — одинаковые у упражнения и растяжки. */
export type ImageCreditFields = {
  imageSource: string | null;
  imageLicense: string | null;
  imageAuthor: string | null;
};

/** Сброс подписи: новое фото загрузил человек, а не взято из источника с лицензией. */
export const NO_CREDIT: ImageCreditFields = {
  imageSource: null,
  imageLicense: null,
  imageAuthor: null,
};

/** null — у фото нет записанной лицензии, подпись не показываем. */
export const imageCredit = (
  record: ImageCreditFields,
): ImageCreditResponseDto | null =>
  record.imageLicense
    ? {
        source: record.imageSource,
        license: record.imageLicense,
        author: record.imageAuthor,
      }
    : null;

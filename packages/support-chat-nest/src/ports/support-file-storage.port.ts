import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface'

/**
 * Вложения. Порядок: multer пишет файл во временное место → prepare (проверка содержимого и итоговый
 * путь) → запись в БД → commit (перенос в постоянное место). Ошибка до commit → discard.
 */
export abstract class SupportFileStorage {
  /** Настройки multer: куда писать временный файл, лимиты, допустимые типы. */
  public abstract multerOptions(): MulterOptions

  /** Проверить содержимое файла и вернуть путь, под которым он будет храниться. Бросает BadRequest. */
  public abstract prepare(file: Express.Multer.File): string

  public abstract commit(file: Express.Multer.File): void

  public abstract discard(file: Express.Multer.File): void

  public abstract toPublicUrl(path: string): string | null

  public abstract remove(path: string): void
}

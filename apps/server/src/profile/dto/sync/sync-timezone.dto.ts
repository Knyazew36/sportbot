import { IsString, MaxLength } from 'class-validator';

/** timezone.set: пояс уже посчитан на телефоне — город из списка или Etc/GMT±N по местному времени. */
export class SyncTimezoneDto {
  @IsString()
  @MaxLength(64)
  zone: string;
}

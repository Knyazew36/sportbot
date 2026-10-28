import { IsInt, IsUUID } from 'class-validator';

/** Упражнение, добавленное в тренировку на телефоне. */
export class SyncNewItemDto {
  @IsUUID()
  clientId: string;

  @IsInt()
  exerciseId: number;
}

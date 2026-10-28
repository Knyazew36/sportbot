import { IsInt, IsUUID } from 'class-validator';

/** Упражнение, добавленное в комплекс на телефоне. */
export class SyncComplexNewItemDto {
  @IsUUID()
  clientId: string;

  @IsInt()
  exerciseId: number;
}

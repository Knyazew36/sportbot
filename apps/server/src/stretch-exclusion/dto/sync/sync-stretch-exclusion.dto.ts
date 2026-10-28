import { IsInt } from 'class-validator';

/** stretchExclusion.create / delete: растяжка, которую заминка не предлагает. */
export class SyncStretchExclusionDto {
  @IsInt()
  stretchId: number;
}

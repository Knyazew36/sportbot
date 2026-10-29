import { Type } from 'class-transformer';
import { IsArray, IsUUID, ValidateNested } from 'class-validator';

import { OnboardingProgramDto } from '../onboarding-program.dto';
import { SyncSourceClientIdDto } from './sync-source-client-id.dto';

/**
 * onboarding.finish: конец настройки, сделанный на телефоне. Программа (с нуля или копия шаблона)
 * уже заведена там — сервер создаёт её с теми же clientId, чтобы pull не привёз вторую копию.
 */
export class SyncOnboardingFinishDto extends OnboardingProgramDto {
  @IsUUID()
  programClientId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncSourceClientIdDto)
  complexes: SyncSourceClientIdDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncSourceClientIdDto)
  items: SyncSourceClientIdDto[];
}

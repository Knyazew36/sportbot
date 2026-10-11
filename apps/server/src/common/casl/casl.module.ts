import { Global, Module } from '@nestjs/common';

import { AbilityFactory } from './ability.factory';

// Global — иначе каждый фичевый модуль, использующий PoliciesGuard, должен был бы явно
// импортировать этот модуль (как PrismaModule.forRoot({isGlobal:true})).
@Global()
@Module({
  providers: [AbilityFactory],
  exports: [AbilityFactory],
})
export class CaslModule {}

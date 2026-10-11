import { Global, Module } from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';

// Единый источник PrismaService на всё приложение. Заменяет пакет `nestjs-prisma`
// из портированного каркаса.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

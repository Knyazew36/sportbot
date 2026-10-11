import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    // Хэш пароля по умолчанию не читается ни одним запросом; где он нужен (вход, смена пароля) —
    // включается точечно через omit: { passwordHash: false }
    super({ adapter, omit: { user: { passwordHash: true } } });
  }
}

import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const BCRYPT_ROUNDS = 11;

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

// Заводит платформенного администратора из PLATFORM_ADMIN_EMAIL / PLATFORM_ADMIN_PASSWORD.
// Повторный запуск пароль не меняет — только гарантирует права.
async function main() {
  const email = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.PLATFORM_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log(
      'Seed пропущен: задайте PLATFORM_ADMIN_EMAIL и PLATFORM_ADMIN_PASSWORD в .env',
    );
    return;
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { isPlatformAdmin: true },
    create: {
      email,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      emailVerified: true,
      isPlatformAdmin: true,
    },
  });

  console.log('Платформенный администратор готов:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const BCRYPT_ROUNDS = 11;

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

// Мышцы в порядке «сверху вниз по телу»: bodyOrder = позиция в списке, по нему сортируется заминка.
// code — ключ для файла-импорта справочника, менять его нельзя: на него ссылаются записи импорта.
const MUSCLES: { code: string; name: string }[] = [
  { code: 'traps', name: 'Трапеции' },
  { code: 'front-delts', name: 'Передние дельты' },
  { code: 'mid-delts', name: 'Средние дельты' },
  { code: 'rear-delts', name: 'Задние дельты' },
  { code: 'chest', name: 'Грудь' },
  { code: 'lats', name: 'Широчайшие' },
  { code: 'biceps', name: 'Бицепс' },
  { code: 'triceps', name: 'Трицепс' },
  { code: 'forearms', name: 'Предплечья' },
  { code: 'abs', name: 'Пресс' },
  { code: 'lower-back', name: 'Разгибатели спины' },
  { code: 'glutes', name: 'Ягодичные' },
  { code: 'quads', name: 'Квадрицепс' },
  { code: 'hamstrings', name: 'Бицепс бедра' },
  { code: 'adductors', name: 'Приводящие' },
  { code: 'calves', name: 'Икры' },
];

const JOINTS: { code: string; name: string }[] = [
  { code: 'neck', name: 'Шея' },
  { code: 'shoulder', name: 'Плечо' },
  { code: 'elbow', name: 'Локоть' },
  { code: 'wrist', name: 'Запястье' },
  { code: 'lower-back', name: 'Поясница' },
  { code: 'hip', name: 'Тазобедренный' },
  { code: 'knee', name: 'Колено' },
  { code: 'ankle', name: 'Голеностоп' },
];

// Закрытые справочники спортбота. Повторный запуск обновляет названия и порядок, дублей не создаёт.
async function seedCatalog() {
  for (const [index, muscle] of MUSCLES.entries()) {
    const data = { name: muscle.name, bodyOrder: index + 1 };
    await prisma.muscle.upsert({
      where: { code: muscle.code },
      update: data,
      create: { code: muscle.code, ...data },
    });
  }
  for (const joint of JOINTS) {
    await prisma.joint.upsert({
      where: { code: joint.code },
      update: { name: joint.name },
      create: joint,
    });
  }
  console.log(
    `Справочники готовы: мышц — ${MUSCLES.length}, суставов — ${JOINTS.length}`,
  );
}

// Заводит платформенного администратора из PLATFORM_ADMIN_EMAIL / PLATFORM_ADMIN_PASSWORD.
// Повторный запуск пароль не меняет — только гарантирует права.
async function seedPlatformAdmin() {
  const email = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.PLATFORM_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log(
      'Админ пропущен: задайте PLATFORM_ADMIN_EMAIL и PLATFORM_ADMIN_PASSWORD в .env',
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

async function main() {
  await seedCatalog();
  await seedPlatformAdmin();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import 'dotenv/config'
import * as bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

const BCRYPT_ROUNDS = 11

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = 'knyazew.sv@gmail.com'
  const passwordHash = await bcrypt.hash('C123456c*', BCRYPT_ROUNDS)

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: 'Сергей',
      lastName: 'Князев',
      emailVerified: true,
    },
  })

  console.log('Seed user готов:', user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

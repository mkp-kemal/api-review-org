// prisma/seed.ts
import { PrismaClient, Role, OrgStatus, Season } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // hash password
  const passwordHash = await bcrypt.hash('1234', 10);

  // 1. Create User
  const user = await prisma.user.create({
    data: {
      email: 'team@gmail.com',
      passwordHash,
      role: Role.TEAM_ADMIN,
      isVerified: true,
    },
  });

  console.log('Seed completed:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

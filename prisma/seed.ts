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
      email: 'reviewer@gmail.com',
      passwordHash,
      role: Role.ORG_ADMIN,
      isVerified: true,
      lastLogin: new Date(),
    },
  });

  // 2. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Sample Sports Org',
      city: 'Los Angeles',
      state: 'CA',
      website: 'https://sample-org.com',
      submittedById: user.id,
      claimedById: user.id,
      status: OrgStatus.APPROVED,
    },
  });

  // 3. Create Team
  const team = await prisma.team.create({
    data: {
      name: 'Sample Team U12',
      ageLevel: '12U',
      division: 'Gold',
      city: 'Los Angeles',
      state: 'CA',
      organizationId: org.id,
      status: OrgStatus.APPROVED,
    },
  });

  // 4. Create Review + Rating
  const review = await prisma.review.create({
    data: {
      userId: user.id,
      teamId: team.id,
      title: 'Great coaching and development!',
      body: 'The coaches really care about player development and safety.',
      season_term: Season.SPRING,
      season_year: 2024,
      isPublic: true,
      rating: {
        create: {
          coaching: 5,
          development: 4,
          transparency: 4,
          culture: 5,
          safety: 5,
          overall: 4.6,
        },
      },
    },
    include: {
      rating: true,
    },
  });

  console.log('Seed completed:', { user, org, team, review });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

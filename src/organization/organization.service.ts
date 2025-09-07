import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrgStatus, Role, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import Redis from 'ioredis';
import { PrismaService } from 'prisma/prisma.service';
import { OrganizationDto } from 'src/auth/dto/create-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService, @InjectRedis() private readonly redis: Redis) { }

  async findAll(query: { name?: string; state?: string; city?: string, isFilterByStatus?: OrgStatus }) {
    const cacheKey = `organizations`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const { name, state, city, isFilterByStatus } = query;

    return this.prisma.organization.findMany({
      where: {
        AND: [
          name ? { name: { contains: name, mode: 'insensitive' } } : {},
          state ? { state: { equals: state, mode: 'insensitive' } } : {},
          city ? { city: { equals: city, mode: 'insensitive' } } : {},
          isFilterByStatus ? { status: { equals: isFilterByStatus } } : {},
        ],
      },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        website: true,
        claimedBy: {
          select: {
            email: true,
          }
        },
        approvedById: true,
        rejectedReason: true,
        updatedAt: true,
        submittedById: true,
        createdAt: true,
        status: true,
        subscription: {
          select: {
            id: true,
            status: true,
            plan: true,
            stripeSubId: true,
            createdAt: true,
          },
        }
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      select: {
        claimedById: true,
        name: true,
        city: true,
        state: true,
        website: true,
        teams: {
          select: {
            name: true,
            ageLevel: true,
            division: true,
            city: true,
            state: true,
            status: true,
            reviews: {
              select: {
                title: true,
                body: true,
                season_term: true,
                season_year: true,
                isPublic: true,
                createdAt: true,
                editedAt: true,
                user: {
                  select: {
                    email: true,
                    role: true,
                  },
                },
                rating: {
                  select: {
                    coaching: true,
                    development: true,
                    transparency: true,
                    culture: true,
                    safety: true,
                    overall: true,
                  },
                },
                orgResponse: {
                  select: {
                    body: true,
                    createdAt: true,
                    user: {
                      select: {
                        email: true,
                        role: true,
                      },
                    },
                  },
                },
                flags: {
                  select: {
                    reason: true,
                    status: true,
                    createdAt: true,
                    reporter: {
                      select: {
                        email: true,
                        role: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async create(data: OrganizationDto) {
    return this.prisma.organization.create({
      data: {
        ...data,
        subscription: {
          create: {
            plan: SubscriptionPlan.BASIC,
            status: SubscriptionStatus.ACTIVE,
            stripeCustomerId: 'default',
            stripeSubId: 'default',
          },
        },
      },
      include: {
        subscription: true,
      },
    });
  }

  async update(id: string, data: any, userId: string) {

    if (data.status === 'REJECTED' && !data.rejectedReason) {
      throw new BadRequestException('Reject reason is required');
    }

    if (data.status === 'REJECTED' && data.rejectedReason) {
      const updatedRejectReason = await this.prisma.organization.update({
        where: { id },
        data: { rejectedReason: data.rejectedReason },
      });

      data.rejectedReason = updatedRejectReason.rejectedReason;
    }

    if (data.status === 'APPROVED') {
      data.approvedById = userId;
    }

    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }


  async claimOrg(orgId: string, userId: string, emailDomain: string) {
    const org = await this.findById(orgId);
    if (org.claimedById) throw new BadRequestException('Organization already claimed');

    
    if (!emailDomain || !org.website?.includes(emailDomain)) {
      throw new BadRequestException('Email domain does not match organization domain');
    }

    await this.prisma.organization.update({
      where: { id: orgId },
      data: { claimedById: userId },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: Role.ORG_ADMIN },
    });

    return {
      message: 'Organization claimed successfully',
    };
  }

  async changeClaimStatus(orgId: string, status: 'approve' | 'reject', userId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    if (!org.claimedById) {
      throw new BadRequestException('No claim found for this organization');
    }

    let newStatus: 'APPROVED' | 'REJECTED';
    if (status === 'approve') {
      newStatus = 'APPROVED';

      await this.prisma.organization.update({
        where: { id: orgId },
        data: {
          rejectedReason: null
        }
      })
    } else if (status === 'reject') {
      newStatus = 'REJECTED';
    } else {
      throw new BadRequestException('Invalid status');
    }

    const updated = await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        status: newStatus,
        approvedById: userId,
        rejectedReason: newStatus === 'REJECTED' ? 'Claim rejected by admin' : null,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  async delete(id: string) {
    const org = await this.findById(id);

    const teamsWithOrg = await this.prisma.team.findMany({ where: { organizationId: id } });
    if (teamsWithOrg.length > 0) {
      throw new BadRequestException('Organization has related teams');
    }

    await this.prisma.subscription.deleteMany({
      where: { organizationId: id },
    });

    return this.prisma.organization.delete({ where: { id } });
  }

  async searchTeamsAndOrganizations(query: string) {
    const teams = await this.prisma.team.findMany({
      where: {
        AND: [
          { status: 'APPROVED' }, 
          {
            organization: { status: 'APPROVED' } 
          },
          {
            OR: [
              { ageLevel: { contains: query, mode: 'insensitive' } },
              { division: { contains: query, mode: 'insensitive' } },
              { city: { contains: query, mode: 'insensitive' } },
              { state: { contains: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } },
              { organization: { name: { contains: query, mode: 'insensitive' } } }
            ]
          }
        ]
      },
      include: {
        organization: true 
      }
    });

    
    const result = teams.map(team => ({
      id: team.id,
      name: team.name,
      organization: team.organization,
      ageLevel: team.ageLevel,
      division: team.division,
      city: team.city,
      state: team.state
    }));

    return { teams: result };
  }

  async csvCreateMany(data: any[]) {
    const createdOrgs = [];
    const skipped: string[] = [];

    for (const row of data) {
      const existing = await this.prisma.organization.findFirst({
        where: { name: row.name },
      });

      if (existing) {
        skipped.push(row.name);
        continue;
      }

      let user: any | null = null;

      if (row.email) {
        user = await this.prisma.user.findUnique({
          where: { email: row.email },
        });

        if (user.role === Role.SITE_ADMIN) {
          throw new BadRequestException(`User with email ${row.email} is already a site admin`);
        }

        if (!user) {
          throw new BadRequestException(`User with email ${row.email} not found`);
        }

        if (!user.isVerified) {
          throw new BadRequestException(`User with email ${row.email} is not verified`);
        }

        if (user.isBanned) {
          throw new BadRequestException(`User with email ${row.email} is banned`);
        }

        if (user.role !== Role.ORG_ADMIN) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { role: Role.ORG_ADMIN },
          });
        }
      }

      const org = await this.prisma.organization.create({
        data: {
          name: row.name,
          state: row.state,
          city: row.city,
          website: row.website,
          status: 'PENDING',
          claimedById: user ? user.id : null,
          subscription: {
            create: {
              plan: SubscriptionPlan.BASIC,
              status: SubscriptionStatus.ACTIVE,
              stripeCustomerId: 'default',
              stripeSubId: 'default',
            },
          },
        },
        include: {
          subscription: true,
        },
      });

      createdOrgs.push(org);
    }

    return {
      created: createdOrgs,
      skipped,
    };
  }

  async getOrganizationWithAccess(userId: string) {
    return this.prisma.organization.findMany({
      where: {
        claimedById: userId
      },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        website: true,
        rejectedReason: true,
        teams: {
          select: {
            id: true,
            name: true,
            division: true,
            ageLevel: true,
            city: true,
            state: true,
            createdAt: true,
            approvedById: true,
            submittedById: true,
            roles: true,
            status: true,
            updatedAt: true,
            subscription: {
              select: {
                id: true,
                status: true,
                plan: true,
                stripeSubId: true,
                createdAt: true,
              },
            }
          }
        },
        subscription: {
          select: {
            id: true,
            status: true,
            plan: true,
            stripeSubId: true,
            createdAt: true,
          },
        },
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
}

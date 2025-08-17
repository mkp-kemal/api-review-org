import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { OrganizationDto } from 'src/auth/dto/create-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) { }

  async findAll(query: { name?: string; state?: string; city?: string }) {
    const { name, state, city } = query;

    return this.prisma.organization.findMany({
      where: {
        AND: [
          name ? { name: { contains: name, mode: 'insensitive' } } : {},
          state ? { state: { equals: state, mode: 'insensitive' } } : {},
          city ? { city: { equals: city, mode: 'insensitive' } } : {},
        ],
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async create(data: OrganizationDto) {
    return this.prisma.organization.create({ data });
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.prisma.organization.update({ where: { id }, data });
  }

  async claimOrg(orgId: string, userId: string, emailDomain: string) {
    const org = await this.findById(orgId);
    if (org.claimedById) throw new BadRequestException('Organization already claimed');

    // Cek domain email user cocok dengan org claim email domain
    if (!emailDomain || !org.website?.includes(emailDomain)) {
      throw new BadRequestException('Email domain does not match organization domain');
    }

    return this.prisma.organization.update({
      where: { id: orgId },
      data: { claimedById: userId },
    });
  }

  async delete(id: string) {
    const org = await this.findById(id);

    const teamsWithOrg = await this.prisma.team.findMany({ where: { organizationId: id } });
    if (teamsWithOrg.length > 0) {
      throw new BadRequestException('Organization has related teams');
    }

    return this.prisma.organization.delete({ where: { id } });
  }

  async searchTeamsAndOrganizations(query: string) {
    const teams = await this.prisma.team.findMany({
      where: {
        AND: [
          { status: 'APPROVED' }, // Hanya team yang approved
          {
            organization: { status: 'APPROVED' } // Hanya organization yang approved
          },
          {
            OR: [
              { ageLevel: { contains: query, mode: 'insensitive' } },
              { division: { contains: query, mode: 'insensitive' } },
              { city: { contains: query, mode: 'insensitive' } },
              { state: { contains: query, mode: 'insensitive' } },
              { organization: { name: { contains: query, mode: 'insensitive' } } }
            ]
          }
        ]
      },
      include: {
        organization: true // Menambahkan relasi organization
      }
    });

    // Format response sesuai kebutuhan
    const result = teams.map(team => ({
      id: team.id,
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
        where: {
          name: row.name,
        },
      });

      if (existing) {
        skipped.push(row.name);
        continue;
      }

      const org = await this.prisma.organization.create({
        data: {
          name: row.name,
          state: row.state,
          city: row.city,
          website: row.website,
          status: 'PENDING',
        },
      });

      createdOrgs.push(org);
    }

    return {
      created: createdOrgs,
      skipped,
    };
  }

}

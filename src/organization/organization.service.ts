import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { name?: string; state?: string; city?: string }) {
    const where: any = {};
    if (query?.name) {
      where.name = { contains: query.name, mode: 'insensitive' };
    }
    if (query?.state) {
      where.state = { equals: query.state, mode: 'insensitive' };
    }
    if (query?.city) {
      where.city = { equals: query.city, mode: 'insensitive' };
    }
    return this.prisma.organization.findMany({ where });
  }

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async create(data: any) {
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
}

import { Controller, Get, Post, Param, Body, Query, UseGuards, Req, Patch } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { RoleGuard } from 'src/auth/strategies/role-guard';
import { OrganizationDto } from 'src/auth/dto/create-organization.dto';
import { Role } from '@prisma/client';
import { AuditLog } from 'src/audit/audit-log.decorator';

@Controller('orgs')
export class OrganizationController {
  constructor(private orgService: OrganizationService) { }

  @AuditLog('READ', 'ORGANIZATION')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN]))
  @Get()
  async listOrgs(
    @Query('name') name?: string,
    @Query('state') state?: string,
    @Query('city') city?: string,
  ) {
    return this.orgService.findAll({ name, state, city });
  }

  @AuditLog('READ', 'ORGANIZATION_DETAIL')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN]))
  @Get(':id')
  async getOrg(@Param('id') id: string) {
    return this.orgService.findById(id);
  }

  @AuditLog('CREATE', 'ORGANIZATION')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN]))
  @Post()
  async createOrg(@Body() data: OrganizationDto) {
    return this.orgService.create(data);
  }

  @AuditLog('UPDATE', 'ORGANIZATION')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN]))
  @Patch(':id')
  async updateOrg(@Param('id') id: string, @Body() data: OrganizationDto) {
    return this.orgService.update(id, data);
  }

  @AuditLog('UPDATE', 'ORGANIZATION_CLAIM')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN]))
  @Patch(':id/claim')
  async claimOrg(@Param('id') id: string, @Req() req) {
    const emailDomain = req.user.email?.split('@')[1];

    return this.orgService.claimOrg(id, req.user.userId, emailDomain);
  }
}

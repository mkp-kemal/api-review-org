import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';

@Controller('orgs')
export class OrganizationController {
  constructor(private orgService: OrganizationService) {}

  @Get()
  async listOrgs(@Query() query: { name?: string; state?: string; city?: string }) {
    return this.orgService.findAll(query);
  }

  @Get(':id')
  async getOrg(@Param('id') id: string) {
    return this.orgService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/claim')
  async claimOrg(@Param('id') id: string, @Req() req) {
    const emailDomain = req.user.email?.split('@')[1];
    return this.orgService.claimOrg(id, req.user.userId, emailDomain);
  }
}

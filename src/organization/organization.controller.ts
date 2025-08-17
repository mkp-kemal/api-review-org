import { Controller, Get, Post, Param, Body, Query, UseGuards, Req, Patch, UseInterceptors, UploadedFile, BadRequestException, Delete } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { RoleGuard } from 'src/auth/strategies/role-guard';
import { OrganizationDto } from 'src/auth/dto/create-organization.dto';
import { Role } from '@prisma/client';
import { AuditLog } from 'src/audit/audit-log.decorator';
import { OptionalJwtAuthGuard } from 'src/auth/strategies/jwt-optional-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import * as csvParser from 'csv-parser';
import { File as MulterFile } from 'multer';
import * as streamifier from 'streamifier';

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

  @AuditLog('DELETE', 'ORGANIZATION')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN]))
  @Delete(':id')
  async deleteOrg(@Param('id') id: string) {
    return this.orgService.delete(id);
  }

  // @UseGuards(OptionalJwtAuthGuard)
  @Get('with/teams')
  async listTeamsAndOrganizations(
    @Query('search') search?: string
  ) {
    return this.orgService.searchTeamsAndOrganizations(search || '');
  }

   @Post('upload-csv')
    @UseInterceptors(FileInterceptor('file'))
    async uploadCsv(@UploadedFile() file: MulterFile) {
      const results: any[] = [];

      if (!file) {
        throw new BadRequestException('No file uploaded');
      }
  
      return new Promise((resolve, reject) => {
        streamifier.createReadStream(file.buffer)
          .pipe(csvParser())
          .on('data', (row: any) => results.push(row))
          .on('end', async () => {
            try {
              const created = await this.orgService.csvCreateMany(results);
              resolve({ message: 'CSV processed successfully', data: created });
            } catch (err) {
              reject(err);
            }
          })
          .on('error', (err) => reject(err));
      });
    }
}

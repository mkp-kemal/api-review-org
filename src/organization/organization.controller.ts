import { Controller, Get, Post, Param, Body, Query, UseGuards, Req, Patch, UseInterceptors, UploadedFile, BadRequestException, Delete } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { RoleGuard } from 'src/auth/strategies/role-guard';
import { OrganizationDto } from 'src/auth/dto/create-organization.dto';
import { OrgStatus, Role } from '@prisma/client';
import { AuditLog } from 'src/audit/audit-log.decorator';
import { OptionalJwtAuthGuard } from 'src/auth/strategies/jwt-optional-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import * as csvParser from 'csv-parser';
import { File as MulterFile } from 'multer';
import * as streamifier from 'streamifier';
import { ApiBody, ApiOkResponse, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateOrganizationDto } from 'src/auth/dto/update-organization.dto';

@ApiTags('Organization')
@Controller('orgs')
export class OrganizationController {
  constructor(private orgService: OrganizationService) { }

  @ApiOkResponse({
    description: 'List of organizations',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cmegvq28o0009gdyj9r5vhdb1' },
          name: { type: 'string', example: 'Alpha Sports' },
          city: { type: 'string', example: 'Los Angeles' },
          state: { type: 'string', example: 'California' },
          website: { type: 'string', example: 'alphasports.com' },
          claimedById: { type: 'string', nullable: true, example: null },
          approvedById: { type: 'string', nullable: true, example: null },
          rejectedReason: { type: 'string', nullable: true, example: null },
          updatedAt: { type: 'string', format: 'date-time', example: '2025-08-21T16:10:20.403Z' },
          submittedById: { type: 'string', nullable: true, example: null },
          createdAt: { type: 'string', format: 'date-time', example: '2025-08-18T08:55:05.688Z' },
          status: { type: 'string', example: 'APPROVED' },
          subscription: {
            oneOf: [
              { type: 'null' },
              {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'subs1' },
                  status: { type: 'string', example: 'ACTIVE' },
                  plan: { type: 'string', example: 'BASIC' },
                  stripeSubId: { type: 'string', nullable: true, example: null },
                  createdAt: { type: 'string', format: 'date-time', example: '2025-08-20T21:22:56.000Z' },
                },
              },
            ],
          },
        },
      },
    },
  })
  @ApiParam({
    name: 'name',
    enum: OrgStatus,
    required: true,
  })
  // @AuditLog('READ', 'ORGANIZATION')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN]))
  @Get()
  async listOrgs(
    @Query('name') name?: string,
    @Query('state') state?: string,
    @Query('city') city?: string,
    @Query('isFilterByStatus') isFilterByStatus?: OrgStatus
  ) {
    return this.orgService.findAll({ name, state, city, isFilterByStatus });
  }

  @ApiOkResponse({
    description: 'Organization detail with teams and reviews',
    schema: {
      type: 'object',
      properties: {
        claimedById: { type: 'string', nullable: true, example: null },
        name: { type: 'string', example: 'Dallas TEST' },
        city: { type: 'string', example: 'Ipsum' },
        state: { type: 'string', example: 'DKI Jakarta' },
        website: { type: 'string', example: 'https://mkemalp.icu' },
        teams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Team A' },
              ageLevel: { type: 'string', example: '12U' },
              division: { type: 'string', example: 'Division 1' },
              city: { type: 'string', example: 'Jakarta' },
              state: { type: 'string', example: 'DKI' },
              status: { type: 'string', example: 'APPROVED' },
              reviews: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', example: 'Great coaching!' },
                    body: { type: 'string', example: 'The team has improved a lot this season.' },
                    season_term: { type: 'string', example: 'SUMMER' },
                    season_year: { type: 'integer', example: 2024 },
                    isPublic: { type: 'boolean', example: false },
                    createdAt: { type: 'string', format: 'date-time' },
                    editedAt: { type: 'string', format: 'date-time', nullable: true },
                    user: {
                      type: 'object',
                      properties: {
                        email: { type: 'string', nullable: true },
                        role: { type: 'string', example: 'SITE_ADMIN' },
                      },
                    },
                    rating: {
                      type: 'object',
                      properties: {
                        coaching: { type: 'number', example: 5 },
                        development: { type: 'number', example: 4 },
                        transparency: { type: 'number', example: 5 },
                        culture: { type: 'number', example: 5 },
                        safety: { type: 'number', example: 5 },
                        overall: { type: 'number', example: 4.8 },
                      },
                    },
                    orgResponse: {
                      oneOf: [
                        { type: 'null' },
                        {
                          type: 'object',
                          properties: {
                            body: { type: 'string', example: 'Thanks u all' },
                            createdAt: { type: 'string', format: 'date-time' },
                            user: {
                              type: 'object',
                              properties: {
                                email: { type: 'string', example: 'mkp.kemal@gmail.com' },
                                role: { type: 'string', example: 'SITE_ADMIN' },
                              },
                            },
                          },
                        },
                      ],
                    },
                    flags: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @AuditLog('READ', 'ORGANIZATION_DETAIL')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN]))
  @Get(':id')
  async getOrg(@Param('id') id: string) {
    return this.orgService.findById(id);
  }

  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  @ApiBody({ type: OrganizationDto })
  @AuditLog('CREATE', 'ORGANIZATION')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
  @Post()
  async createOrg(@Body() data: OrganizationDto) {
    return this.orgService.create(data);
  }

  @ApiResponse({ status: 201, description: 'Organization updated successfully' })
  @ApiBody({ type: UpdateOrganizationDto })
  @AuditLog('UPDATE', 'ORGANIZATION')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN]))
  @Patch(':id')
  async updateOrg(@Param('id') id: string, @Body() data: UpdateOrganizationDto, @Req() req) {
    return this.orgService.update(id, data, req.user.userId);
  }

  @ApiResponse({ status: 201, description: 'Organization claimed successfully' })
  @ApiResponse({
    status: 201,
    description: 'Organization claimed successfully',
    schema: {
      example: {
        claimedById: 'user_456',
      },
    },
  })
  @AuditLog('UPDATE', 'ORGANIZATION_CLAIM')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.REVIEWER, Role.SITE_ADMIN]))
  @Patch(':id/claim')
  async claimOrg(@Param('id') id: string, @Req() req) {
    const emailDomain = req.user.email?.split('@')[1];

    return this.orgService.claimOrg(id, req.user.userId, emailDomain);
  }

  @ApiParam({
    name: 'status',
    enum: ['approve', 'reject'],
    required: true,
  })
  @AuditLog('UPDATE', 'ORGANIZATION_CLAIM_STATUS')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
  @Patch(':id/claim/:status')
  async changeClaimStatus(@Param('id') id: string, @Param('status') status: 'approve' | 'reject', @Req() req) {
    if (status !== 'approve' && status !== 'reject') {
      throw new BadRequestException('Invalid status');
    }

    return this.orgService.changeClaimStatus(id, status, req.user.userId);
  }

  @ApiResponse({ status: 201, description: 'Organization deleted successfully' })
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

  @AuditLog('CREATE', 'ORGANIZATION_CSV')
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

  @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN]))
  @Get('access/claim')
  async getOrganizationWithAccess(@Req() req) {
    return this.orgService.getOrganizationWithAccess(req.user.userId);
  }
}

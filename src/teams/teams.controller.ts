import {
  BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post,
  Req,
  UploadedFile, UseGuards, UseInterceptors
} from "@nestjs/common";
import { TeamService } from "./team.service";
import { JwtAuthGuard } from "src/auth/strategies/jwt-auth.guard";
import { RoleGuard } from "src/auth/strategies/role-guard";
import { Role } from "@prisma/client";
import { AuditLog } from "src/audit/audit-log.decorator";
import { TeamDto } from "src/auth/dto/create-team.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import * as csvParser from 'csv-parser';
import { File as MulterFile } from 'multer';
import * as streamifier from 'streamifier';
import { ApiTags, ApiResponse, ApiConsumes, ApiBody } from "@nestjs/swagger";

@ApiTags('Teams')
@Controller('teams')
export class TeamController {
  constructor(private teamService: TeamService) { }

  // @AuditLog('READ', 'TEAMS')
  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN, Role.ORG_ADMIN, Role.TEAM_ADMIN]))
  @ApiResponse({ status: 200, description: 'List of all teams with subscription & organization info' })
  getTeams() {
    return this.teamService.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Details of a specific team including reviews & ratings' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  getTeamById(@Param('id') id: string) {
    return this.teamService.findById(id);
  }

  @AuditLog('CREATE', 'TEAM')
  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
  @ApiResponse({ status: 201, description: 'Team created successfully' })
  @ApiBody({ type: TeamDto })
  createTeam(@Body() teamDto: TeamDto) {
    return this.teamService.create(teamDto);
  }

  @AuditLog('UPDATE', 'TEAM')
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
  @ApiResponse({ status: 200, description: 'Team updated successfully' })
  @ApiBody({ type: TeamDto })
  updateTeam(@Param('id') id: string, @Body() teamDto: TeamDto, @Req() req) {
    return this.teamService.update(id, teamDto, req.user.userId);
  }

  @AuditLog('DELETE', 'TEAM')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Team deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete team with related reviews' })
  deleteTeam(@Param('id') id: string) {
    return this.teamService.delete(id);
  }

  @Post('upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string', example: 'org_123' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'CSV uploaded and processed successfully' })
  async uploadCsv(
    @UploadedFile() file: MulterFile,
    @Body('organizationId') organizationId: string,
  ) {
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
            const created = await this.teamService.csvCreateMany(results, organizationId);
            resolve({ message: 'CSV processed successfully', data: created });
          } catch (err) {
            reject(err);
          }
        })
        .on('error', (err) => reject(err));
    });
  }
}

import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
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

@Controller('teams')
export class TeamController {
  constructor(private teamService: TeamService) { }

  @AuditLog('READ', 'TEAMS')
  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
  getTeams() {
    return this.teamService.findAll();
  }

  @AuditLog('READ', 'TEAM_DETAIL')
  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
  getTeamById(@Param('id') id: string) {
    return this.teamService.findById(id);
  }

  @AuditLog('CREATE', 'TEAM')
  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
  createTeam(@Body() teamDto: TeamDto) {
    return this.teamService.create(teamDto);
  }

  @AuditLog('UPDATE', 'TEAM')
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
  updateTeam(@Param('id') id: string, @Body() teamDto: TeamDto) {
    return this.teamService.update(id, teamDto);
  }

  @AuditLog('DELETE', 'TEAM')
  @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
  @Delete(':id')
  deleteTeam(@Param('id') id: string) {
    return this.teamService.delete(id);
  }

  @Post('upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(@UploadedFile() file: MulterFile, @Body('organizationId') organizationId: string,) {
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
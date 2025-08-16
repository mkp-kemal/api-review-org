import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { TeamService } from "./team.service";
import { JwtAuthGuard } from "src/auth/strategies/jwt-auth.guard";
import { RoleGuard } from "src/auth/strategies/role-guard";
import { Role } from "@prisma/client";
import { AuditLog } from "src/audit/audit-log.decorator";
import { TeamDto } from "src/auth/dto/create-team.dto";

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
}
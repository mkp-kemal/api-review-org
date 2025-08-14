// flags.controller.ts
import { Controller, Post, Param, Body, Get, Patch, UseGuards, Request } from '@nestjs/common';
import { FlagsService } from './flags.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { CreateFlagDto } from 'src/auth/dto/create-flag.dto';
import { UpdateFlagDto } from 'src/auth/dto/update-flag.dto';
import { RoleGuard } from 'src/auth/strategies/role-guard';
import { Role } from '@prisma/client';
import { AuditLog } from 'src/audit/audit-log.decorator';

@Controller()
export class FlagsController {
    constructor(private readonly flagsService: FlagsService) { }

    @AuditLog('CREATE', 'FLAG')
    @UseGuards(JwtAuthGuard)
    @Post('reviews/:id/flag')
    async flagReview(@Param('id') reviewId: string, @Body() dto: CreateFlagDto, @Request() req) {
        return this.flagsService.flagReview(reviewId, req.user.userId, dto);
    }

    @AuditLog('READ', 'FLAG')
    @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
    @Get('admin/flags')
    async listFlags() {
        return this.flagsService.listFlags();
    }

    @AuditLog('READ', 'FLAG_DETAIL')
    @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
    @Get('admin/flags/:id')
    async getFlag(@Param('id') id: string) {
        return this.flagsService.getFlag(id);
    }

    @AuditLog('CREATE', 'FLAG_RESOLVE')
    @UseGuards(JwtAuthGuard)
    @Post('admin/flags/:id/resolve')
    async resolveFlag(@Param('id') id: string) {
        return this.flagsService.resolveFlag(id);
    }

    @AuditLog('UPDATE', 'FLAG')
    @UseGuards(JwtAuthGuard)
    @Patch('admin/flag/:id')
    async updateFlagStatus(@Param('id') id: string, @Body() dto: UpdateFlagDto) {
        return this.flagsService.updateFlagStatus(id, dto);
    }
}

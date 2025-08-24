import {
    Controller,
    Get,
    Patch,
    Param,
    UseGuards,
    Request,
    Res,
    Body,
    Delete
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { AdminReviewDto } from 'src/auth/dto/admin-review.dto';
import { AdminUserDto } from 'src/auth/dto/admin-user.dto';
import { Role } from '@prisma/client';
import { RoleGuard } from 'src/auth/strategies/role-guard';
import { AuditLog } from 'src/audit/audit-log.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @AuditLog('READ', 'REVIEWS_ADMIN')
    @UseGuards(JwtAuthGuard)
    @Get('reviews')
    async getAllReviews(@Request() req) {
        return this.adminService.getAllReviews();
    }

    @AuditLog('UPDATE', 'REVIEWS_HIDE')
    @UseGuards(JwtAuthGuard)
    @Patch('reviews/:id/hide')
    async toggleReviewVisibility(
        @Param('id') id: string,
        @Body() dto: AdminReviewDto,
        @Request() req
    ) {
        return this.adminService.toggleReviewVisibility(id, dto);
    }

    @AuditLog('READ', 'USER')
    @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
    @Get('users')
    async getAllUsers(@Request() req) {
        return this.adminService.getAllUsers();
    }

    @AuditLog('UPDATE', 'USER_HIDE')
    @UseGuards(JwtAuthGuard)
    @Patch('users/:id/ban')
    async toggleUserBan(
        @Param('id') id: string,
        @Body() dto: AdminUserDto,
        @Request() req
    ) {
        return this.adminService.toggleUserBan(id, dto, req.user.userId);
    }

    @AuditLog('READ', 'REVIEWS_EXPORT')
    @UseGuards(JwtAuthGuard)
    @Get('export/reviews.csv')
    async exportReviewsToCsv(@Request() req, @Res() res: Response) {
        return this.adminService.exportReviewsToCsv(res);
    }

    @AuditLog('READ', 'FLAGS_EXPORT')
    @UseGuards(JwtAuthGuard)
    @Get('export/flags.csv')
    async exportFlagsToCsv(@Request() req, @Res() res: Response) {
        return this.adminService.exportFlagsToCsv(res);
    }

    @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
    @Get('audit-logs')
    async getAuditLogs(@Request() req) {
        return this.adminService.getAuditLogs();
    }

    @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
    @Delete('audit-logs')
    async deleteAuditLogs(@Request() req) {
        return this.adminService.deleteAuditLogs();
    }
}
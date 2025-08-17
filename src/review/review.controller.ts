import { Controller, Post, Body, Param, UseGuards, Req, Get, Query, Put, BadRequestException } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from 'src/auth/dto/create-review.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { RoleGuard } from 'src/auth/strategies/role-guard';
import { OptionalJwtAuthGuard } from 'src/auth/strategies/jwt-optional-auth.guard';
import { Role } from '@prisma/client';
import { AuditLog } from 'src/audit/audit-log.decorator';
import { UpdateReviewDto } from 'src/auth/dto/update-review.dto';

@Controller('teams')
export class ReviewController {
    constructor(private reviewService: ReviewService) { }

    // @AuditLog('CREATE', 'REVIEWS')
    // review.controller.ts
    @UseGuards(OptionalJwtAuthGuard)
    @Post(':teamId/reviews')
    async create(
        @Req() req,
        @Param('teamId') teamId: string,
        @Body() dto: CreateReviewDto & { userId?: string },
    ) {
        // Kalau login → pakai userId dari token
        // Kalau anonymous → pakai userId dari body (FE sudah generate & kirim)
        const userId = req.user?.userId ?? dto.userId;

        if (!userId) {
            throw new BadRequestException('userId is required');
        }

        return this.reviewService.createReview(userId, teamId, dto);
    }


    @AuditLog('UPDATE', 'REVIEWS')
    @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
    @Put(':teamId/reviews/update')
    async update(
        @Req() req,
        @Param('teamId') teamId: string,
        @Body() dto: UpdateReviewDto,
    ) {
        return this.reviewService.updateReview(req.user.userId, teamId, dto);
    }

    // @AuditLog('READ', 'REVIEWS')
    @UseGuards(OptionalJwtAuthGuard)
    @Get('reviews')
    async list(@Query('sort') sort: 'recent' | 'rating' = 'recent') {
        return this.reviewService.getReviews(sort);
    }

    @AuditLog('READ', 'REVIEWS_BY_TEAM_ID')
    @UseGuards(JwtAuthGuard, RoleGuard([Role.REVIEWER, Role.SITE_ADMIN]))
    @Get('reviews/:teamId')
    async listByTeam(@Param('teamId') teamId: string) {
        return this.reviewService.getReview(teamId);
    }

}

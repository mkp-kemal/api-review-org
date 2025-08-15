import { Controller, Post, Body, Param, UseGuards, Req, Get, Query, Put } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from 'src/auth/dto/create-review.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { RoleGuard } from 'src/auth/strategies/role-guard';
import { OptionalJwtAuthGuard } from 'src/auth/strategies/jwt-optional-auth.guard';
import { Role } from '@prisma/client';
import { AuditLog } from 'src/audit/audit-log.decorator';

@Controller('teams')
export class ReviewController {
    constructor(private reviewService: ReviewService) { }

    // @AuditLog('CREATE', 'REVIEWS')
    @UseGuards(OptionalJwtAuthGuard)
    @Post(':teamId/reviews')
    async create(
        @Req() req,
        @Param('teamId') teamId: string,
        @Body() dto: CreateReviewDto,
    ) {
        // userId bisa didapat dari req.user (login) atau dari header/body untuk anonymous
        // Misal anonymous kirim userId di header 'x-anonymous-userid'
        const anonymousUserId = req.headers['x-anonymous-userid'] as string | undefined;
        const userId = req.user?.userId ?? anonymousUserId ?? null;

        const result = await this.reviewService.createReview(userId, teamId, dto);

        return result;
    }

    @AuditLog('UPDATE', 'REVIEWS')
    @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
    @Put(':teamId/reviews/update')
    async update(
        @Req() req,
        @Param('teamId') teamId: string,
        @Body() dto: CreateReviewDto,
    ) {
        return this.reviewService.updateReview(req.user.userId, teamId, dto);
    }

    @AuditLog('READ', 'REVIEWS')
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

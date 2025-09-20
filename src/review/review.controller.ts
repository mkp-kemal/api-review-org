import { Controller, Post, Body, Param, UseGuards, Req, Get, Query, Put, BadRequestException, Patch, Delete, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from 'src/auth/dto/create-review.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { RoleGuard } from 'src/auth/strategies/role-guard';
import { OptionalJwtAuthGuard } from 'src/auth/strategies/jwt-optional-auth.guard';
import { Role } from '@prisma/client';
import { AuditLog } from 'src/audit/audit-log.decorator';
import { UpdateReviewDto } from 'src/auth/dto/update-review.dto';
import { CreateResponseReviewDto } from 'src/auth/dto/create-response-review.dto';
import { Response } from 'express';
import { format } from 'date-fns';

@ApiTags('Reviews')
@Controller('teams')
export class ReviewController {
    constructor(private reviewService: ReviewService) { }

    @ApiOperation({ summary: 'Create a review for a team' })
    @ApiResponse({ status: 201, description: 'Review created successfully' })
    @ApiResponse({ status: 400, description: 'Validation error or team not found' })
    @ApiBody({ type: CreateReviewDto })
    @UseGuards(OptionalJwtAuthGuard)
    @Post(':teamId/reviews')
    async create(
        @Req() req,
        @Param('teamId') teamId: string,
        @Body() dto: CreateReviewDto & { userId?: string },
    ) {
        const userId = req.user?.userId ?? dto.userId;

        if (!userId) throw new BadRequestException('userId is required');

        return this.reviewService.createReview(userId, teamId, dto);
    }

    @ApiOperation({ summary: 'Update a review' })
    @ApiResponse({ status: 200, description: 'Review updated successfully' })
    @ApiResponse({ status: 404, description: 'Review not found' })
    @ApiBody({ type: UpdateReviewDto })
    @AuditLog('UPDATE', 'REVIEWS')
    @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN, Role.ORG_ADMIN, Role.TEAM_ADMIN]))
    @Put(':teamId/reviews/update')
    async update(
        @Req() req,
        @Param('teamId') teamId: string,
        @Body() dto: UpdateReviewDto,
    ) {
        return this.reviewService.updateReview(req.user.userId, teamId, dto);
    }

    @ApiOperation({ summary: 'Update review visibility (isPublic)' })
    @ApiResponse({ status: 200, description: 'Review status updated successfully' })
    @ApiResponse({ status: 404, description: 'Review not found' })
    @AuditLog('UPDATE', 'REVIEWS_STATUS')
    @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN, Role.ORG_ADMIN, Role.TEAM_ADMIN]))
    @Put(':teamId/reviews/status')
    async updateStatus(
        @Param('teamId') teamId: string,
        @Body('isPublic') isPublic: boolean,
    ) {
        return this.reviewService.updateReviewStatus(teamId, isPublic);
    }

    @ApiOperation({ summary: 'Update highlight' })
    @ApiResponse({ status: 200, description: 'Highlight review updated successfully' })
    @ApiResponse({ status: 404, description: 'Review not found' })
    @AuditLog('UPDATE', 'REVIEWS_HIGHLIGHT')
    @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN, Role.ORG_ADMIN, Role.TEAM_ADMIN]))
    @Patch(':reviewId/reviews/highlight')
    async updateHighlight(
        @Param('reviewId') reviewId: string,
    ) {
        return this.reviewService.updateReviewHighlight(reviewId);
    }

    @ApiOperation({ summary: 'List reviews (sorted by recent or rating)' })
    @ApiQuery({ name: 'sort', enum: ['recent', 'rating'], required: false })
    @ApiResponse({ status: 200, description: 'List of reviews returned' })
    @UseGuards(OptionalJwtAuthGuard)
    @Get('reviews')
    async list(@Query('sort') sort: 'recent' | 'rating' = 'recent') {
        return this.reviewService.getReviews(sort, false);
    }

    @ApiOperation({ summary: 'List reviews public (sorted by recent or rating)' })
    @ApiQuery({ name: 'sort', enum: ['recent', 'rating'], required: false })
    @ApiResponse({ status: 200, description: 'List of reviews returned' })
    @UseGuards(OptionalJwtAuthGuard)
    @Get('reviews/public')
    async listPublic(@Query('sort') sort: 'recent' | 'rating' = 'recent') {
        return this.reviewService.getReviews(sort);
    }

    @ApiOperation({ summary: 'Get review details by ID' })
    @ApiResponse({ status: 200, description: 'Review found and returned' })
    @ApiResponse({ status: 404, description: 'Review not found' })
    @AuditLog('READ', 'REVIEWS_BY_TEAM_ID')
    @UseGuards(JwtAuthGuard, RoleGuard([Role.REVIEWER, Role.SITE_ADMIN]))
    @Get('reviews/:teamId')
    async listByTeam(@Param('teamId') teamId: string) {
        return this.reviewService.getReview(teamId);
    }

    @ApiOperation({ summary: 'Respond to a review' })
    @ApiResponse({ status: 200, description: 'Response created or updated successfully' })
    @ApiResponse({ status: 404, description: 'Review not found' })
    @ApiBody({ type: CreateResponseReviewDto })
    @AuditLog('CREATE', 'REVIEWS_RESPOND')
    @Patch(':id/respond')
    @UseGuards(JwtAuthGuard)
    async respondToReview(
        @Param('id') reviewId: string,
        @Body() dto: CreateResponseReviewDto,
        @Req() req,
    ) {
        return this.reviewService.respondToReview(reviewId, req.user.userId, dto);
    }

    @ApiOperation({ summary: 'List years of reviews 5 years ago' })
    @Get('years')
    async listByYear() {
        const currentYear = new Date().getFullYear();
        const years = [];

        for (let i = 0; i <= 5; i++) {
            years.push(currentYear - i);
        }

        return { years };
    }

    @UseGuards(JwtAuthGuard, RoleGuard([Role.ORG_ADMIN, Role.SITE_ADMIN, Role.TEAM_ADMIN]))
    @Get('reviews/access/claim')
    async getOrganizationWithAccess(@Req() req, @Query('sort') sort: 'recent' | 'rating' = 'recent') {
        return this.reviewService.getReviewsWithAccess(req.user.userId, sort);
    }

    @Delete('reviews/:id')
    @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN]))
    async deleteReview(@Param('id') id: string) {
        return this.reviewService.deleteReview(id);
    }

    @Get('export/reviews/csv')
    @UseGuards(JwtAuthGuard, RoleGuard([Role.SITE_ADMIN, Role.ORG_ADMIN, Role.TEAM_ADMIN]))
    async exportCSV(
        @Query('sort') sort: 'recent' | 'rating' = 'recent',
        @Query('isByPublic') isByPublic: boolean = false,
        @Res() res: Response,
    ) {
        try {
            const csv = await this.reviewService.exportCSV(sort, isByPublic);
            const now = new Date();
            const timestamp = format(now, 'yyyyMMdd-HHmmss');
            const filename = `review-export-${timestamp}.csv`;

            res.header('Content-Type', 'text/csv');
            res.header('Content-Disposition', `attachment; filename=${filename}`);
            res.status(200).send(csv);
        } catch (error) {
            res.status(500).send({ message: 'Failed to export CSV', error: error.message });
        }
    }
}

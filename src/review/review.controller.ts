import { Controller, Post, Body, Param, UseGuards, Req, Get, Query, Put } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from 'src/auth/dto/create-review.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';

@Controller('teams')
export class ReviewController {
    constructor(private reviewService: ReviewService) { }

    @UseGuards(JwtAuthGuard)
    @Post(':teamId/reviews')
    async create(
        @Req() req,
        @Param('teamId') teamId: string,
        @Body() dto: CreateReviewDto,
    ) {
        return this.reviewService.createReview(req.user.userId, teamId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Put(':teamId/reviews/update')
    async update(
        @Req() req,
        @Param('teamId') teamId: string,
        @Body() dto: CreateReviewDto,
    ) {
        return this.reviewService.updateReview(req.user.userId, teamId, dto);
    }

    @Get()
    async list(@Param('teamId') teamId: string, @Query('sort') sort: 'recent' | 'rating' = 'recent') {
        return this.reviewService.getReviews(teamId, sort);
    }
}

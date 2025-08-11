import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateReviewDto } from 'src/auth/dto/create-review.dto';

@Injectable()
export class ReviewService {
    constructor(private prisma: PrismaService) { }

    async createReview(userId: string, teamId: string, dto: CreateReviewDto) {
        const exists = await this.prisma.review.findUnique({
            where: { userId_teamId_season: { userId, teamId, season: dto.season } },
        });
        if (exists) throw new BadRequestException('You already submitted a review for this team this season.');

        const overall =
            (dto.coaching + dto.development + dto.transparency + dto.culture + dto.safety) / 5;

        return this.prisma.review.create({
            data: {
                userId,
                teamId,
                title: dto.title,
                body: dto.body,
                season: dto.season,
                coaching: dto.coaching,
                development: dto.development,
                transparency: dto.transparency,
                culture: dto.culture,
                safety: dto.safety,
                overall,
                isPublic: dto.isPublic ?? true,
            },
        });
    }

    async updateReview (userId: string, teamId: string, dto: CreateReviewDto) {
        const review = await this.prisma.review.findUnique({
            where: { userId_teamId_season: { userId, teamId, season: dto.season } },
        });
        if (!review) throw new NotFoundException('Review not found');

        return this.prisma.review.update({
            where: { id: review.id },
            data: {
                title: dto.title,
                body: dto.body,
                coaching: dto.coaching,
                development: dto.development,
                transparency: dto.transparency,
                culture: dto.culture,
                safety: dto.safety,
                isPublic: dto.isPublic ?? true,
                editedAt: new Date(),
            },
        });
    }

    async getReviews(teamId: string, sort: 'recent' | 'rating' = 'recent') {
        const orderBy =
            sort === 'rating' ? { overall: 'desc' as const } : { createdAt: 'desc' as const };

        return this.prisma.review.findMany({
            where: { teamId, isPublic: true },
            orderBy,
            include: {
                orgResponse: true,
            },
        });
    }

}

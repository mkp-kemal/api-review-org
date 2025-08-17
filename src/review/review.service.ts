import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateReviewDto } from 'src/auth/dto/create-review.dto';
import { UpdateReviewDto } from 'src/auth/dto/update-review.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReviewService {
    constructor(private prisma: PrismaService) { }

    async createReview(
        userId: string,
        teamId: string,
        dto: CreateReviewDto,
    ) {
        // Pastikan user ada, kalau tidak buat user ANONYMOUS
        let user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    id: userId,
                    role: 'ANONYMOUS',
                    email: null,
                    passwordHash: null,
                    isVerified: false,
                },
            });
        }

        
        // Cek id team
        const team = await this.prisma.team.findUnique({ where: { id: teamId } });
        if (!team) {
            throw new BadRequestException('Team not found');
        }

        // Cek uniqueness berdasarkan user, team, season term + year
        const exists = await this.prisma.review.findUnique({
            where: {
                userId_teamId_season_term_season_year: {
                    userId,
                    teamId,
                    season_term: dto.season_term,
                    season_year: dto.season_year,
                },
            },
        });
        if (exists) {
            throw new BadRequestException(
                'You already submitted a review for this team in this season and year.'
            );
        }

        // Hitung overall rating
        const overall =
            (dto.coaching + dto.development + dto.transparency + dto.culture + dto.safety) / 5;

        // Simpan review dengan snapshot usia tim
        const review = await this.prisma.review.create({
            data: {
                userId,
                teamId,
                title: dto.title,
                body: dto.body,
                season_term: dto.season_term,
                season_year: dto.season_year,
                age_level_at_review: team.ageLevel,
                // isPublic: dto.isPublic ?? false,
            },
        });

        // Simpan rating
        await this.prisma.rating.create({
            data: {
                reviewId: review.id,
                coaching: dto.coaching,
                development: dto.development,
                transparency: dto.transparency,
                culture: dto.culture,
                safety: dto.safety,
                overall,
            },
        });

        // Ambil kembali review lengkap beserta relasi
        const result = await this.prisma.review.findUnique({
            where: { id: review.id },
            include: {
                rating: true,
                orgResponse: true,
                team: { include: { organization: true } },
            },
        });

        return { ...result, userId };
    }


    async updateReview(userId: string, teamId: string, dto: UpdateReviewDto) {
        const review = await this.prisma.review.findUnique({
            where: { userId_teamId_season_term_season_year: { userId, teamId, season_term: dto.season_term, season_year: dto.season_year } },
            include: { rating: true },
        });
        if (!review) throw new NotFoundException('Review not found');

        const overall =
            (dto.coaching + dto.development + dto.transparency + dto.culture + dto.safety) / 5;

        // Update review fields
        await this.prisma.review.update({
            where: { id: review.id },
            data: {
                title: dto.title,
                body: dto.body,
                isPublic: dto.isPublic ?? true,
                editedAt: new Date(),
            },
        });

        // Update rating terkait
        await this.prisma.rating.update({
            where: { reviewId: review.id },
            data: {
                coaching: dto.coaching,
                development: dto.development,
                transparency: dto.transparency,
                culture: dto.culture,
                safety: dto.safety,
                overall,
            },
        });

        // Return review lengkap dengan rating
        return this.prisma.review.findUnique({
            where: { id: review.id },
            include: { rating: true, orgResponse: true, team: { include: { organization: true } } },
        });
    }

    async getReviews(sort: 'recent' | 'rating' = 'recent') {
        const orderBy =
            sort === 'rating' ? { rating: { overall: 'desc' as const } } : { createdAt: 'desc' as const };

        return this.prisma.review.findMany({
            where: { isPublic: true },
            orderBy,
            include: {
                rating: true,
                orgResponse: true,
                team: {
                    include: {
                        organization: true,
                    },
                },
            },
        });
    }

    async getReview(id: string) {
        const review = await this.prisma.review.findUnique({
            where: { id },
            include: { rating: true, orgResponse: true, team: { include: { organization: true } } },
        });
        if (!review) throw new NotFoundException('Review not found');
        return review;
    }
}

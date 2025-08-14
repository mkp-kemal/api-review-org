import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateReviewDto } from 'src/auth/dto/create-review.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReviewService {
    constructor(private prisma: PrismaService) { }

    async createReview(
        userId: string | null, // bisa dari token kalau login, atau dari anonymous id
        teamId: string,
        dto: CreateReviewDto,
    ) {
        if (!userId) {
            // Kalau tidak ada userId dari frontend, buat id baru
            userId = uuidv4();
        }

        // Cek user exist di DB
        let user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            // Jika belum ada, buat user anonymous
            user = await this.prisma.user.create({
                data: {
                    id: userId,
                    role: 'ANONYMOUS', // pastikan role ini ada di enum Role
                    email: null,
                    passwordHash: null, // atau kosong
                    isVerified: false,
                },
            });
        }

        // Cek duplicate review
        const exists = await this.prisma.review.findUnique({
            where: { userId_teamId_season: { userId, teamId, season: dto.season } },
        });
        if (exists)
            throw new BadRequestException(
                'You already submitted a review for this team this season.',
            );

        const overall =
            (dto.coaching + dto.development + dto.transparency + dto.culture + dto.safety) /
            5;

        // Buat review
        const review = await this.prisma.review.create({
            data: {
                userId,
                teamId,
                title: dto.title,
                body: dto.body,
                season: dto.season,
                isPublic: dto.isPublic ?? true,
            },
        });

        // Buat rating terkait
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

        // Return review + rating + userId (agar frontend simpan userId nya)
        const result = await this.prisma.review.findUnique({
            where: { id: review.id },
            include: { rating: true, orgResponse: true, team: { include: { organization: true } } },
        });

        return { ...result, userId };
    }

    async updateReview(userId: string, teamId: string, dto: CreateReviewDto) {
        const review = await this.prisma.review.findUnique({
            where: { userId_teamId_season: { userId, teamId, season: dto.season } },
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

import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from 'prisma/prisma.service';
import { CreateResponseReviewDto } from 'src/auth/dto/create-response-review.dto';
import { CreateReviewDto } from 'src/auth/dto/create-review.dto';
import { UpdateReviewDto } from 'src/auth/dto/update-review.dto';
import { ErrorCode } from 'src/common/error-code';
import { EmailService } from 'src/email/email.service';
import { Parser } from 'json2csv';

@Injectable()
export class ReviewService {
    constructor(private prisma: PrismaService, @InjectRedis() private readonly redis: Redis, private emailService: EmailService,
    ) { }

    async createReview(
        userId: string,
        teamId: string,
        dto: CreateReviewDto,
    ) {
        let user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    id: userId,
                    role: 'ANONYMOUS',
                    email: null,
                    passwordHash: null,
                    isVerified: false,
                    lastLogin: new Date()
                },
            });

            await this.prisma.auditLog.create({
                data: {
                    actor: {
                        connect: { id: userId || 'ANONYMOUS' }
                    },
                    action: 'CREATE',
                    targetType: 'USER_ON_REVIEW',
                    targetId: userId,
                },
            });
        }

        if (["SITE_ADMIN", "ORG_ADMIN", "TEAM_ADMIN"].includes(user.role)) {
            throw new ForbiddenException("Admins are not allowed to submit reviews");
        }


        const team = await this.prisma.team.findUnique({ where: { id: teamId } });
        if (!team) {
            throw new BadRequestException('Team not found');
        }


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


        const overall =
            (dto.coaching + dto.development + dto.transparency + dto.culture + dto.safety) / 5;


        const review = await this.prisma.review.create({
            data: {
                userId,
                teamId,
                title: dto.title,
                body: dto.body,
                season_term: dto.season_term,
                season_year: dto.season_year,
                age_level_at_review: team.ageLevel,
                isPublic: true,
            },
        });


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


        const result = await this.prisma.review.findUnique({
            where: { id: review.id },
            include: {
                rating: true,
                orgResponse: true,
                team: { include: { organization: true } },
            },
        });

        await this.prisma.auditLog.create({
            data: {
                actor: {
                    connect: { id: userId || 'ANONYMOUS' }
                },
                action: 'CREATE',
                targetType: 'REVIEW',
                targetId: review.id,
            },
        });

        if (user.email) {
            await this.emailService.sendReviewsPost({
                email: user.email,
                date: new Date(),
                team: team.name,
                title: dto.title,
                body: dto.body,
                teamUrl: `${process.env.APP_URL}/Org_profile.html?id=${team.id}`,
                star: overall
            });
        }

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


        await this.prisma.review.update({
            where: { id: review.id },
            data: {
                title: dto.title,
                body: dto.body,
                isPublic: dto.isPublic ?? true,
                editedAt: new Date(),
            },
        });


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


        return this.prisma.review.findUnique({
            where: { id: review.id },
            include: { rating: true, orgResponse: true, team: { include: { organization: true } } },
        });
    }

    async updateReviewStatus(reviewId: string, isPublic: boolean) {
        const review = await this.prisma.review.findFirst({
            where: { id: reviewId },
        });
        if (!review) throw new NotFoundException('Review not found');

        return this.prisma.review.update({
            where: { id: reviewId },
            data: {
                isPublic,
                editedAt: new Date(),
            },
            include: {
                rating: true,
                orgResponse: true,
                team: { include: { organization: true } },
            },
        });
    }

    async updateReviewHighlight(id: string) {
        const review = await this.prisma.review.findUnique({
            where: { id },
            select: { teamId: true },
        });

        if (!review) {
            throw new Error(ErrorCode.REVIEW_NOT_FOUND);
        }

        await this.prisma.review.updateMany({
            where: { teamId: review.teamId, isHighlight: true },
            data: { isHighlight: false },
        });

        return this.prisma.review.update({
            where: { id },
            data: { isHighlight: true },
            include: {
                rating: true,
                orgResponse: true,
                team: { include: { organization: true } },
            },
        });
    }



    async getReviews(
        sort: 'recent' | 'rating' = 'recent',
        isByPublic = true,
    ) {







        const orderBy =
            sort === 'rating'
                ? { rating: { overall: 'desc' as const } }
                : { createdAt: 'desc' as const };

        const where: any = {};
        if (isByPublic) {
            where.isPublic = true;
        }

        const reviews = await this.prisma.review.findMany({
            where,
            orderBy,
            include: {
                rating: true,
                orgResponse: {
                    select: {
                        body: true,
                        createdAt: true,
                        user: {
                            select: { email: true },
                        },
                    },
                },
                team: {
                    include: {
                        organization: true,
                        subscription: {
                            select: {
                                plan: true,
                            }
                        },
                    },
                },
                user: {
                    select: { email: true },
                },
                flags: {
                    select: {
                        id: true,
                        reporter: {
                            select: { email: true },
                        },
                        status: true,
                        reason: true,
                        createdAt: true,
                    },
                },
            },
        });




        return reviews;
    }


    async getReview(id: string) {
        const review = await this.prisma.review.findUnique({
            where: { id },
            include: { rating: true, orgResponse: true, team: { include: { organization: true } } },
        });
        if (!review) throw new NotFoundException('Review not found');
        return review;
    }


    async respondToReview(
        reviewId: string,
        orgUserId: string,
        dto: CreateResponseReviewDto
    ) {

        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
            include: { team: { include: { subscription: true } } }
        });

        if (!review) {
            throw new NotFoundException(ErrorCode.REVIEW_NOT_FOUND);
        }


        const organization = await this.prisma.organization.findUnique({
            where: { id: review.team.organizationId },
            include: { subscription: true }
        });

        if (!organization) {
            throw new NotFoundException(ErrorCode.ORGANIZATION_NOT_FOUND);
        }


        const teamPlan = review.team.subscription?.plan;
        const orgPlan = organization.subscription?.plan;
        const effectivePlan = teamPlan || orgPlan;


        if (!['PRO', 'ELITE'].includes(effectivePlan)) {
            throw new ForbiddenException(ErrorCode.PLAN_NOT_SUPPORTED);
        }


        const existingResponse = await this.prisma.orgResponse.findUnique({
            where: { reviewId },
        });

        if (existingResponse) {

            return this.prisma.orgResponse.update({
                where: { reviewId },
                data: { body: dto.body },
            });
        }


        return this.prisma.orgResponse.create({
            data: {
                reviewId,
                orgUserId,
                body: dto.body,
            },
        });
    }


    async getReviewsWithAccess(userId: string, sort: 'recent' | 'rating' = 'recent') {
        const orgs = await this.prisma.organization.findMany({
            where: { claimedById: userId },
            select: { id: true },
        });

        const orgIds = orgs.map(o => o.id);

        const sortObj: any = {};

        if (sort === 'recent') {
            sortObj.createdAt = 'desc';
        } else if (sort === 'rating') {
            sortObj.rating = {
                overall: 'desc'
            };
        }

        return this.prisma.review.findMany({
            where: {
                OR: [
                    {
                        team: {
                            organization: { claimedById: userId },
                        },
                    },
                    {
                        team: { claimedById: userId },
                    },
                ],
            },
            include: {
                rating: true,
                orgResponse: true,
                flags: {
                    select: {
                        id: true,
                        reporter: {
                            select: { email: true },
                        },
                        status: true,
                        reason: true,
                        createdAt: true,
                    },
                },
                team: {
                    include: {
                        organization: true
                    }
                },
            },
            orderBy: sortObj,
        });
    }

    async deleteReview(id: string) {
        const review = await this.prisma.review.findUnique({ where: { id } });
        if (!review) {
            throw new NotFoundException('Review not found');
        }

        return this.prisma.review.delete({ where: { id } });
    }

    async exportCSV(sort: 'recent' | 'rating' = 'recent', isByPublic = true) {
        const reviews = await this.getReviews(sort, isByPublic);

        const csvData = reviews.map((review, index) => {
            const flags = review.flags.length > 0
                ? review.flags
                    .map(f => `${f.reporter?.email || 'unknown'} - ${f.reason || 'no reason'}`)
                    .join('; ')
                : 'No flags';

            return {
                No: index + 1,
                ReviewID: review.id,
                Title: review.title,
                Body: review.body,
                Season: `${review.season_term} ${review.season_year}`,
                AgeLevel: review.age_level_at_review,
                IsPublic: review.isPublic ? 'Yes' : 'No',
                CreatedAt: review.createdAt.toISOString(),
                EditedAt: review.editedAt ? review.editedAt.toISOString() : 'Never',
                IsHighlight: review.isHighlight ? 'Yes' : 'No',
                RatingOverall: review.rating.overall,
                RatingCoaching: review.rating.coaching,
                RatingDevelopment: review.rating.development,
                RatingTransparency: review.rating.transparency,
                RatingCulture: review.rating.culture,
                RatingSafety: review.rating.safety,
                TeamName: review.team.name,
                TeamDivision: review.team.division,
                TeamCity: review.team.city,
                TeamState: review.team.state,
                OrganizationName: review.team.organization.name,
                OrganizationStatus: review.team.organization.status,
                SubscriptionPlan: review.team.subscription?.plan || 'N/A',
                ReviewerEmail: review.user.email,
                OrgResponse: review.orgResponse ? review.orgResponse.body : 'No response',
                OrgResponderEmail: review.orgResponse?.user?.email || 'N/A',
                Flags: flags,
            };
        });


        const fields = [
            'No',
            'ReviewID',
            'Title',
            'Body',
            'Season',
            'AgeLevel',
            'IsPublic',
            'CreatedAt',
            'EditedAt',
            'IsHighlight',
            'RatingOverall',
            'RatingCoaching',
            'RatingDevelopment',
            'RatingTransparency',
            'RatingCulture',
            'RatingSafety',
            'TeamName',
            'TeamDivision',
            'TeamCity',
            'TeamState',
            'OrganizationName',
            'OrganizationStatus',
            'SubscriptionPlan',
            'ReviewerEmail',
            'OrgResponse',
            'OrgResponderEmail',
            'Flags',
        ];

        const opts = { fields };
        const parser = new Parser(opts);

        try {
            const csv = parser.parse(csvData);
            return csv;
        } catch (err) {
            console.error(err);
            throw new Error('Error generating CSV');
        }
    }
}

import { BadRequestException, Injectable } from "@nestjs/common";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { PrismaService } from "prisma/prisma.service";
import { TeamDto } from "src/auth/dto/create-team.dto";

@Injectable()
export class TeamService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.team.findMany({
            select: {
                id: true,
                name: true,
                division: true,
                ageLevel: true,
                city: true,
                state: true,
                createdAt: true,
                approvedById: true,
                submittedById: true,
                roles: true,
                status: true,
                updatedAt: true,
                organization: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        state: true,
                        website: true,
                        createdAt: true
                    }
                },
                subscription: {
                    select: {
                        id: true,
                        status: true,
                        plan: true,
                        stripeSubId: true,
                        createdAt: true,
                    },
                }
            }
        });
    }

    async findById(id: string) {
        const team = await this.prisma.team.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                division: true,
                ageLevel: true,
                city: true,
                state: true,
                status: true,
                organization: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        state: true,
                        website: true,
                        createdAt: true
                    }
                },
                reviews: {
                    select: {
                        id: true,
                        age_level_at_review: true,
                        body: true,
                        title: true,
                        season_term: true,
                        season_year: true,
                        createdAt: true,
                        isPublic: true,
                        orgResponse: {
                            select: {
                                id: true,
                                body: true,
                                user: {
                                    select: { email: true }
                                },
                                createdAt: true
                            }
                        },
                        user: {
                            select: { email: true }
                        },
                        rating: {
                            select: {
                                id: true,
                                culture: true,
                                development: true,
                                coaching: true,
                                safety: true,
                                transparency: true,
                                overall: true
                            }
                        }
                    }
                }
            }
        });

        if (!team) return null;

        // Hitung akumulasi rating
        const reviews = team.reviews ?? [];
        if (reviews.length > 0) {
            const sum = {
                culture: 0,
                development: 0,
                coaching: 0,
                safety: 0,
                transparency: 0,
                overall: 0
            };

            reviews.forEach((rev) => {
                if (rev.rating) {
                    sum.culture += rev.rating.culture ?? 0;
                    sum.development += rev.rating.development ?? 0;
                    sum.coaching += rev.rating.coaching ?? 0;
                    sum.safety += rev.rating.safety ?? 0;
                    sum.transparency += rev.rating.transparency ?? 0;
                    sum.overall += rev.rating.overall ?? 0;
                }
            });

            const count = reviews.length;
            team["accumulation"] = {
                culture: +(sum.culture / count).toFixed(1),
                development: +(sum.development / count).toFixed(1),
                coaching: +(sum.coaching / count).toFixed(1),
                safety: +(sum.safety / count).toFixed(1),
                transparency: +(sum.transparency / count).toFixed(1),
                overall: +(sum.overall / count).toFixed(1),
            };
        } else {
            team["accumulation"] = null;
        }

        return team;
    }


    async create(data: TeamDto) {
        return this.prisma.team.create({
            data: {
                ...data,
                status: 'PENDING',
            }
        });
    }

    async update(id: string, data: any) {
        await this.findById(id);
        return this.prisma.team.update({ where: { id }, data });
    }

    async delete(id: string) {
        await this.findById(id);

        const reviewCount = await this.prisma.review.count({
            where: { teamId: id },
        });

        if (reviewCount > 0) {
            throw new BadRequestException('Team has related reviews, cannot delete');
        }

        return this.prisma.team.delete({ where: { id } });
    }


    async csvCreateMany(data: any[], organizationId: string) {
        const createdTeams = [];
        const skipped: string[] = [];
        const seenNames = new Set<string>();

        for (const row of data) {
            // ✅ Validasi field wajib
            if (!row.name || !row.ageLevel || !row.division || !row.state || !row.city) {
                throw new BadRequestException(
                    `Missing required fields for team: ${JSON.stringify(row)}`
                );
            }

            // ✅ Cek duplikat di CSV (case-insensitive bisa pakai toLowerCase kalau perlu)
            if (seenNames.has(row.name)) {
                skipped.push(row.name);
                continue;
            }
            seenNames.add(row.name);

            // ✅ Cek duplikat di DB
            const existing = await this.prisma.team.findFirst({
                where: {
                    name: row.name,
                    // organizationId,
                },
            });

            if (existing) {
                skipped.push(row.name);
                continue;
            }

            // ✅ Create team + subscription
            const team = await this.prisma.team.create({
                data: {
                    name: row.name,
                    ageLevel: row.ageLevel,
                    division: row.division,
                    state: row.state,
                    city: row.city,
                    organizationId,
                    status: 'PENDING',
                    subscription: {
                        create: {
                            plan: SubscriptionPlan.BASIC,
                            status: SubscriptionStatus.ACTIVE,
                            stripeCustomerId: 'default',
                            stripeSubId: 'default',
                        },
                    },
                },
                include: {
                    subscription: true,
                },
            });

            createdTeams.push(team);
        }

        return {
            created: createdTeams,
            skipped,
        };
    }


}
import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Role, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
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
                claimedBy: {
                    select: {
                        email: true
                    }
                },
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
                claimedById: true,
                organization: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        state: true,
                        website: true,
                        claimedById: true,
                        createdAt: true
                    }
                },
                reviews: {
                    where: { isPublic: true },
                    select: {
                        id: true,
                        age_level_at_review: true,
                        body: true,
                        title: true,
                        season_term: true,
                        season_year: true,
                        createdAt: true,
                        isPublic: true,
                        flags: {
                            select: {
                                reporterUserId: true
                            }
                        },
                        orgResponse: {
                            select: {
                                id: true,
                                body: true,
                                user: {
                                    select: {
                                        email: true,
                                        role: true
                                    }
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



    async create(data: TeamDto, userId: string) {
        try {
            let user = null;
            let totalClaims = 0;

            if (data.email) {
                // Cari user berdasarkan email
                user = await this.prisma.user.findUnique({
                    where: { email: data.email },
                    include: { teamClaims: true },
                });

                if (!user) {
                    throw new NotFoundException(`User with email ${data.email} not found`);
                }

                // Cek role
                if (user.role === Role.ORG_ADMIN || user.role === Role.SITE_ADMIN) {
                    throw new ForbiddenException(
                        `User with role ${user.role} cannot claim a team`,
                    );
                }

                if (!user.isVerified) {
                    throw new ForbiddenException(
                        `User with email ${data.email} is not verified`,
                    );
                }

                totalClaims = user.teamClaims.length + 1;
            }

            // Buat team + subscription dalam transaksi biar aman
            const { email, ...teamData } = data;

            const [team] = await this.prisma.$transaction([
                this.prisma.team.create({
                    data: {
                        ...teamData,  // ini hanya berisi name, ageLevel, division, state, city, organizationId
                        claimedById: user?.id ?? null,
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
                }),
                ...(user
                    ? [
                        this.prisma.user.update({
                            where: { id: user.id },
                            data: { role: Role.TEAM_ADMIN },
                        }),
                    ]
                    : []),
            ]);

            await this.prisma.auditLog.create({
                data: {
                    actor: {
                        connect: { id: userId || Role.ANONYMOUS }
                    },
                    action: 'UPDATE',
                    targetType: 'ROLE_USER',
                    targetId: user.id,
                    metadata: {
                        team,
                        message: user
                            ? `User with email ${data.email} has now claimed ${totalClaims} teams including this one`
                            : `Team created without user claim`,
                    }
                },
            });

            return {
                team,
                message: user
                    ? `User with email ${data.email} has now claimed ${totalClaims} teams including this one`
                    : `Team created without user claim`,
            };
        } catch (error) {
            console.error('Error creating team:', error);
            if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error; // biarkan NestJS handle
            }
            throw new InternalServerErrorException('Failed to create team');
        }
    }
    async update(id: string, data: any, userId: string) {

        if (data.status === 'REJECTED' && !data.rejectedReason) {
            throw new BadRequestException('Reject reason is required');
        }

        if (data.status === 'REJECTED' && data.rejectedReason) {
            const updatedRejectReason = await this.prisma.team.update({
                where: { id },
                data: { rejectedReason: data.rejectedReason },
            });

            data.rejectedReason = updatedRejectReason.rejectedReason;
        }

        if (data.status === 'APPROVED') {
            data.approvedById = userId;
        }

        return this.prisma.team.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        await this.findById(id);

        const reviewCount = await this.prisma.review.count({
            where: { teamId: id },
        });

        if (reviewCount > 0) {
            throw new BadRequestException('Team has related reviews, cannot delete');
        }

        await this.prisma.subscription.deleteMany({
            where: { teamId: id },
        });

        return this.prisma.team.delete({ where: { id } });
    }


    async csvCreateMany(data: any[], organizationId: string) {
        const seenNames = new Set<string>();
        const skipped: string[] = [];

        // ✅ Step 1: Validasi semua row sebelum transaksi
        const teamsToCreate: { row: any; user: any | null }[] = [];

        for (const row of data) {
            // Required fields (email tidak masuk)
            if (!row.name || !row.ageLevel || !row.division || !row.state || !row.city) {
                throw new BadRequestException(`Missing required fields: ${JSON.stringify(row)}`);
            }

            // Cek duplikat di CSV
            if (seenNames.has(row.name)) {
                skipped.push(row.name);
                continue;
            }
            seenNames.add(row.name);

            let user: any | null = null;

            // ✅ Kalau ada email, cek user exist + verified
            if (row.email) {
                user = await this.prisma.user.findUnique({
                    where: { email: row.email },
                });

                if (!user) {
                    throw new BadRequestException(`User with email ${row.email} not found`);
                }
                if (!user.isVerified) {
                    throw new BadRequestException(`User with email ${row.email} is not verified`);
                }
            }

            // Cek duplikat di DB
            const existing = await this.prisma.team.findFirst({
                where: { name: row.name, organizationId },
            });
            if (existing) {
                skipped.push(row.name);
                continue;
            }

            teamsToCreate.push({ row, user });
        }

        // ✅ Step 2: Jalankan transaksi atomic
        const createdTeams = await this.prisma.$transaction(
            teamsToCreate.map(({ row, user }) =>
                this.prisma.team.create({
                    data: {
                        name: row.name,
                        ageLevel: row.ageLevel,
                        division: row.division,
                        state: row.state,
                        city: row.city,
                        organizationId,
                        status: 'PENDING',
                        claimedById: user ? user.id : null, // ✅ kalau ada email → pakai ID user, kalau tidak → null
                        subscription: {
                            create: {
                                plan: SubscriptionPlan.BASIC,
                                status: SubscriptionStatus.ACTIVE,
                                stripeCustomerId: 'default',
                                stripeSubId: 'default',
                            },
                        },
                        // roles: user
                        //   ? {
                        //       create: {
                        //         userId: user.id,
                        //         role: 'TEAM_ADMIN',
                        //       },
                        //     }
                        //   : undefined, // ✅ roles hanya dibuat kalau ada user
                    },
                    include: { subscription: true },
                })
            )
        );

        return {
            created: createdTeams,
            skipped,
        };
    }



    async getTeamsWithAccess(userId: string, role: string) {
        if (role === 'ORG_ADMIN') {
            const orgs = await this.prisma.organization.findMany({
                where: { claimedById: userId },
                select: { id: true }
            });

            const orgIds = orgs.map(o => o.id);

            return this.prisma.team.findMany({
                where: {
                    organizationId: { in: orgIds }
                },
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

        if (role === 'TEAM_ADMIN') {
            return this.prisma.team.findMany({
                where: { claimedById: userId },
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
    }

    async claimTeamByEmail(userId: string, email: string, teamId: string) {
        let user = null;
        let totalClaims = 0;

        if (!email) {
            throw new BadRequestException('Email is required');
        }

        user = await this.prisma.user.findUnique({
            where: { email: email },
            include: { teamClaims: true },
        });

        if (!user) {
            throw new NotFoundException(`User with email ${email} not found`);
        }

        // Role tidak boleh claim
        if (user.role === 'ORG_ADMIN' || user.role === 'SITE_ADMIN') {
            throw new ForbiddenException(
                `User cannot claim a team`,
            );
        }

        if (!user.isVerified) {
            throw new ForbiddenException(
                `User with email ${email} is not verified`,
            );
        }

        // ✅ Cari team dulu
        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
        });

        if (!team) {
            throw new NotFoundException(`Team with id ${teamId} not found`);
        }

        // ✅ Cek apakah sudah pernah di-claim
        if (team.claimedById) {
            throw new ForbiddenException(
                `Team is already claimed by another user`,
            );
        }

        totalClaims = user.teamClaims.length + 1;

        // Update team claimById
        const updateTeam = await this.prisma.team.update({
            where: { id: teamId },
            data: {
                claimedById: user.id
            },
        });

        // Jika user masih reviewer → upgrade ke TEAM_ADMIN
        if (user.role === Role.REVIEWER) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { role: Role.TEAM_ADMIN },
            });

            // Audit log
            await this.prisma.auditLog.create({
                data: {
                    actor: {
                        connect: { id: userId || Role.ANONYMOUS },
                    },
                    action: 'UPDATE',
                    targetType: 'ROLE_USER',
                    targetId: user.id,
                    metadata: {
                        updateTeam,
                        message: `User with email ${email} has now claimed ${totalClaims} teams including this one`,
                    },
                },
            });
        }


        return { message: 'Team successfully claimed', updateTeam };
    }



}
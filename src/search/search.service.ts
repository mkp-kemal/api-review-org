// search.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

interface SearchParams {
    query?: string;
    state?: string;
    ageLevel?: string;
    division?: string;
    sort?: 'name' | 'recent';
    page?: number;
    limit?: number;
}

@Injectable()
export class SearchService {
    constructor(private prisma: PrismaService) { }

    async search(params: SearchParams) {
        const {
            query,
            state,
            ageLevel,
            division,
            sort = 'name',
            page = 1,
            limit = 10,
        } = params;

        const whereOrg: any = {
            AND: [
                query ? { name: { contains: query, mode: 'insensitive' } } : {},
                state ? { state: { equals: state, mode: 'insensitive' } } : {},
            ],
        };

        const whereTeam: any = {
            AND: [
                query
                    ? { organization: { name: { contains: query, mode: 'insensitive' } } }
                    : {},
                state ? { state: { equals: state, mode: 'insensitive' } } : {},
                ageLevel ? { ageLevel: { equals: ageLevel, mode: 'insensitive' } } : {},
                division ? { division: { equals: division, mode: 'insensitive' } } : {},
            ],
        };


        const [orgs, teams] = await Promise.all([
            this.prisma.organization.findMany({
                where: whereOrg,
                orderBy: sort === 'recent' ? { createdAt: 'desc' } : { name: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.team.findMany({
                where: whereTeam,
                orderBy:
                    sort === 'recent'
                        ? { createdAt: 'desc' }
                        : { organization: { name: 'asc' } },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    organization: true,
                },
            }),
        ]);

        return {
            organizations: orgs,
            teams: teams,
            page,
            limit,
        };
    }
}

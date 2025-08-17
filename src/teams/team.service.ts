import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { TeamDto } from "src/auth/dto/create-team.dto";

@Injectable()
export class TeamService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.team.findMany({
            include: {
                organization: true,
            },
        });
    }

    async findById(id: string) {
        return this.prisma.team.findUnique({
            where: { id },
            include: {
                organization: true,
            },
        });
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
        return this.prisma.team.delete({ where: { id } });
    }

    async csvCreateMany(data: any[], organizationId: string) {
        const createdTeams = [];
    const skipped: string[] = [];

        for (const row of data) {
            const existing = await this.prisma.team.findFirst({
                where: {
                    name: row.name,
                    organizationId: organizationId,
                },
            });

            if (existing) {
                skipped.push(row.name);
                continue;
            }

            const team = await this.prisma.team.create({
                data: {
                    name: row.name,
                    ageLevel: row.ageLevel,
                    division: row.division,
                    state: row.state,
                    city: row.city,
                    organizationId: organizationId,
                    status: 'PENDING',
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
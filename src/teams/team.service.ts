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

}